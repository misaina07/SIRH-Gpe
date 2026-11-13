package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PayrollAggregationService {
    private final JdbcTemplate jdbc;
    private final EmployeeAccessService access;

    public PayrollAggregationService(JdbcTemplate jdbc, EmployeeAccessService access) {
        this.jdbc = jdbc;
        this.access = access;
    }

    @Transactional
    public List<Map<String, Object>> variables(String rawMonth, Authentication actor) {
        requirePayrollAccess(actor);
        YearMonth month = parseMonth(rawMonth);
        LocalDate from = month.atDay(1);
        LocalDate to = month.plusMonths(1).atDay(1);
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.id AS employee_id, e.first_name, e.last_name, e.email_pro,
                   ? AS period_month,
                   COALESCE((SELECT SUM(s.overtime_25_minutes) FROM daily_time_sheets s
                             WHERE s.employee_id=e.id AND s.work_date>=? AND s.work_date<?),0) AS overtime_25_minutes,
                   COALESCE((SELECT SUM(s.overtime_50_minutes) FROM daily_time_sheets s
                             WHERE s.employee_id=e.id AND s.work_date>=? AND s.work_date<?),0) AS overtime_50_minutes,
                   COALESCE((SELECT SUM(r.total_business_days) FROM leave_requests r
                             JOIN leave_types t ON t.id=r.leave_type_id
                             WHERE r.employee_id=e.id AND r.status='approuve'
                               AND t.unpaid_for_payroll=TRUE AND r.start_date<? AND r.end_date>=?),0) AS unpaid_absence_days,
                   COALESCE((SELECT SUM(p.amount) FROM time_on_call_premiums p
                             WHERE p.employee_id=e.id AND p.work_date>=? AND p.work_date<?),0) AS on_call_amount,
                   COALESCE((SELECT preference FROM time_overtime_preferences p
                             WHERE p.employee_id=e.id AND p.week_start<=? ORDER BY p.week_start DESC LIMIT 1),'PAIEMENT') AS overtime_preference
            FROM employees e
            WHERE e.status='actif'
            ORDER BY e.last_name, e.first_name, e.id
            """, from, from, to, from, to, to, from, from, to, from);
        storeSnapshot(rows, month, actor.getName());
        return rows;
    }

    public byte[] csv(String rawMonth, Authentication actor) {
        List<Map<String, Object>> rows = variables(rawMonth, actor);
        StringBuilder csv = new StringBuilder("employee_id;first_name;last_name;email;period_month;overtime_25_minutes;overtime_50_minutes;unpaid_absence_days;on_call_amount;overtime_preference\n");
        for (Map<String, Object> row : rows) {
            csv.append(value(row.get("employee_id"))).append(';')
                .append(value(row.get("first_name"))).append(';')
                .append(value(row.get("last_name"))).append(';')
                .append(value(row.get("email_pro"))).append(';')
                .append(value(row.get("period_month"))).append(';')
                .append(value(row.get("overtime_25_minutes"))).append(';')
                .append(value(row.get("overtime_50_minutes"))).append(';')
                .append(value(row.get("unpaid_absence_days"))).append(';')
                .append(value(row.get("on_call_amount"))).append(';')
                .append(value(row.get("overtime_preference"))).append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void storeSnapshot(List<Map<String, Object>> rows, YearMonth month, String actor) {
        for (Map<String, Object> row : rows) {
            jdbc.update("""
                INSERT INTO payroll_monthly_variables
                    (employee_id,period_month,overtime_25_minutes,overtime_50_minutes,
                     unpaid_absence_days,on_call_amount,overtime_preference,generated_by)
                VALUES (?,?,?,?,?,?,?,?)
                ON CONFLICT(employee_id,period_month) DO UPDATE SET
                    overtime_25_minutes=EXCLUDED.overtime_25_minutes,
                    overtime_50_minutes=EXCLUDED.overtime_50_minutes,
                    unpaid_absence_days=EXCLUDED.unpaid_absence_days,
                    on_call_amount=EXCLUDED.on_call_amount,
                    overtime_preference=EXCLUDED.overtime_preference,
                    generated_by=EXCLUDED.generated_by,
                    generated_at=CURRENT_TIMESTAMP
                """, row.get("employee_id"), month.atDay(1), integer(row.get("overtime_25_minutes")),
                integer(row.get("overtime_50_minutes")), decimal(row.get("unpaid_absence_days")),
                decimal(row.get("on_call_amount")), row.get("overtime_preference"), actor);
        }
    }

    private void requirePayrollAccess(Authentication actor) {
        if (!access.isHr(actor) && !access.isFinance(actor)) {
            throw new ForbiddenOperationException("Export paie réservé aux RH et à la Finance.");
        }
    }

    private YearMonth parseMonth(String rawMonth) {
        try {
            YearMonth month = YearMonth.parse(rawMonth);
            if (month.isAfter(YearMonth.now().plusMonths(1))) throw new IllegalArgumentException("La période ne peut pas être future.");
            return month;
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("La période doit respecter le format YYYY-MM.");
        }
    }

    private int integer(Object value) { return value instanceof Number number ? number.intValue() : 0; }
    private BigDecimal decimal(Object value) { return value instanceof BigDecimal decimal ? decimal : BigDecimal.ZERO; }
    private String value(Object value) { return csvEscape(value == null ? "" : value.toString()); }
    private String csvEscape(String value) { return value.contains(";") || value.contains("\"") || value.contains("\n") ? "\"" + value.replace("\"", "\"\"") + "\"" : value; }
}
