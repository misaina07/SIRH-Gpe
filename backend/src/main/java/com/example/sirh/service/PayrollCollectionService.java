package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class PayrollCollectionService {
    private final JdbcTemplate jdbc;
    private final EmployeeAccessService access;

    public PayrollCollectionService(JdbcTemplate jdbc, EmployeeAccessService access) {
        this.jdbc = jdbc;
        this.access = access;
    }

    public List<Map<String, Object>> periods(Authentication actor) {
        access.requireHr(actor);
        return jdbc.queryForList("""
                SELECT id,annee,mois,date_debut,date_fin,verrouillee,statut
                FROM periode_paie ORDER BY date_debut DESC
                """);
    }

    @Transactional
    public Map<String, Object> openPeriod(int year, int month, Authentication actor) {
        access.requireHr(actor);
        if (month < 1 || month > 12) throw new IllegalArgumentException("Mois invalide.");
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        return jdbc.queryForMap("""
                INSERT INTO periode_paie(annee,mois,date_debut,date_fin)
                VALUES (?,?,?,?)
                ON CONFLICT(annee,mois) DO UPDATE SET annee=EXCLUDED.annee
                RETURNING id,annee,mois,date_debut,date_fin,verrouillee,statut
                """, year, month, start, end);
    }

    public Map<String, Object> collect(LocalDate from, LocalDate to, Integer employeeId, Authentication actor) {
        access.requireHr(actor);
        if (employeeId != null) {
            if (jdbc.queryForObject("SELECT count(*) FROM employees WHERE id=?", Integer.class, employeeId) == 0)
                throw new ResourceNotFoundException("Salarié introuvable.");
        }
        if (from.isAfter(to)) throw new IllegalArgumentException("Période invalide.");

        List<Map<String, Object>> rows = employeeRows(from, to, employeeId);
        for (var row : rows) {
            int id = ((Number) row.get("id")).intValue();
            row.putAll(timeSummary(id, from, to));
            row.putAll(leaveSummary(id, from, to));
            row.put("night_minutes", nightMinutes(id, from, to));
            row.put("sunday_worked_minutes", sundayMinutes(id, from, to));
            row.put("holiday_worked_minutes", holidayMinutes(id, from, to));
            row.put("manual_variables", variablesForEmployee(id, from, to));
        }
        return Map.of("from", from, "to", to, "employees", rows);
    }

    private List<Map<String, Object>> employeeRows(LocalDate from, LocalDate to, Integer employeeId) {
        List<Object> params = new ArrayList<>(List.of(to, from));
        String sql = """
                SELECT id,matricule,first_name,last_name,
                       monthly_gross_salary,fixed_bonus,variable_bonus,
                       work_regime,grade,start_date,end_date
                FROM v_payroll_employee_contract
                WHERE (start_date IS NULL OR start_date<=?)
                  AND (end_date IS NULL OR end_date>=?)
                """;
        if (employeeId != null) {
            sql += " AND id=?";
            params.add(employeeId);
        }
        sql += " ORDER BY last_name,first_name";
        return jdbc.queryForList(sql, params.toArray());
    }

    private Map<String, Object> timeSummary(int employeeId, LocalDate from, LocalDate to) {
        return jdbc.queryForMap("""
                SELECT coalesce(sum(effective_worked_minutes),0) effective_worked_minutes,
                       coalesce(sum(overtime_25_minutes),0) overtime_25_minutes,
                       coalesce(sum(overtime_50_minutes),0) overtime_50_minutes
                FROM v_payroll_time_entries
                WHERE employee_id=? AND work_date BETWEEN ? AND ?
                """, employeeId, from, to);
    }

    private Map<String, Object> leaveSummary(int employeeId, LocalDate from, LocalDate to) {
        return jdbc.queryForMap("""
                SELECT coalesce(sum(CASE WHEN requires_balance THEN total_business_days ELSE 0 END),0) absence_days,
                       coalesce(sum(CASE WHEN leave_type_id='SANS_SOLDE' THEN total_business_days ELSE 0 END),0) leave_without_pay_days
                FROM v_payroll_leave_entries
                WHERE employee_id=? AND status='approuve'
                  AND start_date<=? AND end_date>=?
                """, employeeId, to, from);
    }

    public List<Map<String, Object>> variables(LocalDate period, Integer employeeId, Authentication actor) {
        access.requireHr(actor);
        List<Object> params = new ArrayList<>(List.of(period));
        String sql = """
                SELECT v.id,v.employee_id,e.matricule,e.first_name,e.last_name,
                       p.annee,p.mois,v.rubrique_code,v.quantite,v.montant,v.semaine,
                       r.libelle,r.type
                FROM variable_paie v
                JOIN employees e ON e.id=v.employee_id
                JOIN periode_paie p ON p.id=v.periode_id
                JOIN rubrique_paie r ON r.code=v.rubrique_code
                WHERE p.date_debut=? 
                """;
        if (employeeId != null) {
            sql += " AND v.employee_id=?";
            params.add(employeeId);
        }
        sql += " ORDER BY e.last_name,e.first_name,v.rubrique_code";
        return jdbc.queryForList(sql, params.toArray());
    }

    @Transactional
    public Map<String, Object> addVariable(int employeeId, LocalDate period, String code,
                                           BigDecimal quantite, BigDecimal montant, Integer semaine,
                                           Authentication actor) {
        access.requireHr(actor);
        if (jdbc.queryForObject("SELECT count(*) FROM employees WHERE id=?", Integer.class, employeeId) == 0)
            throw new ResourceNotFoundException("Salarié introuvable.");
        if (jdbc.queryForObject("SELECT count(*) FROM rubrique_paie WHERE code=?", Integer.class, code) == 0)
            throw new IllegalArgumentException("Rubrique de paie inconnue.");
        if (quantite == null) quantite = BigDecimal.ZERO;
        if (montant == null) montant = BigDecimal.ZERO;
        if (quantite.signum() < 0 || montant.signum() < 0)
            throw new IllegalArgumentException("Quantité et montant doivent être positifs.");
        if (semaine != null && (semaine < 1 || semaine > 5))
            throw new IllegalArgumentException("Semaine invalide.");

        var periode = jdbc.query("""
                SELECT id,verrouillee FROM periode_paie
                WHERE date_debut<=? AND date_fin>=?
                """, (rs, row) -> Map.of("id", rs.getInt("id"), "locked", rs.getBoolean("verrouillee")),
                period, period).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Période de paie introuvable."));
        if (Boolean.TRUE.equals(periode.get("locked")))
            throw new WorkflowConflictException("La période de paie est verrouillée.");

        return jdbc.queryForMap("""
                INSERT INTO variable_paie(periode_id,employee_id,rubrique_code,quantite,montant,semaine)
                VALUES (?,?,?,?,?,?)
                RETURNING id,periode_id,employee_id,rubrique_code,quantite,montant,semaine
                """, periode.get("id"), employeeId, code, quantite, montant, semaine);
    }

    @Transactional
    public void deleteVariable(long id, Authentication actor) {
        access.requireHr(actor);
        int deleted = jdbc.update("""
                DELETE FROM variable_paie v
                USING periode_paie p
                WHERE v.id=? AND v.periode_id=p.id AND p.verrouillee=false
                """, id);
        if (deleted == 0) throw new WorkflowConflictException("Variable introuvable ou période verrouillée.");
    }

    private List<Map<String, Object>> variablesForEmployee(int employeeId, LocalDate from, LocalDate to) {
        return jdbc.queryForList("""
                SELECT v.rubrique_code,v.quantite,v.montant,v.semaine,r.libelle,r.type
                FROM variable_paie v
                JOIN periode_paie p ON p.id=v.periode_id
                JOIN rubrique_paie r ON r.code=v.rubrique_code
                WHERE v.employee_id=? AND p.date_debut=? AND p.date_fin=?
                ORDER BY v.rubrique_code,v.semaine
                """, employeeId, from, to);
    }

    private int nightMinutes(int employeeId, LocalDate from, LocalDate to) {
        var sheets = jdbc.query("""
                SELECT first_in,last_out FROM daily_time_sheets
                WHERE employee_id=? AND work_date BETWEEN ? AND ?
                  AND first_in IS NOT NULL AND last_out IS NOT NULL
                """, (rs, row) -> new OffsetDateTime[]{
                        rs.getObject("first_in", OffsetDateTime.class),
                        rs.getObject("last_out", OffsetDateTime.class)
                }, employeeId, from, to);
        int total = 0;
        for (var pair : sheets) total += overlapMinutes(pair[0], pair[1], 22, 4);
        return total;
    }

    private int sundayMinutes(int employeeId, LocalDate from, LocalDate to) {
        return jdbc.queryForObject("""
                SELECT COALESCE(sum(effective_worked_minutes),0)
                FROM daily_time_sheets
                WHERE employee_id=? AND work_date BETWEEN ? AND ?
                  AND extract(dow from work_date)=0
                """, Integer.class, employeeId, from, to);
    }

    private int holidayMinutes(int employeeId, LocalDate from, LocalDate to) {
        return jdbc.queryForObject("""
                SELECT COALESCE(sum(s.effective_worked_minutes),0)
                FROM daily_time_sheets s
                JOIN leave_public_holidays h ON h.holiday_date=s.work_date
                WHERE s.employee_id=? AND s.work_date BETWEEN ? AND ?
                """, Integer.class, employeeId, from, to);
    }

    private int overlapMinutes(OffsetDateTime start, OffsetDateTime end, int nightStart, int nightEnd) {
        int total = 0;
        var day = start.toLocalDate();
        while (!day.isAfter(end.toLocalDate())) {
            var zone = start.getOffset();
            var a = start.toInstant().isBefore(day.atTime(java.time.LocalTime.of(nightStart, 0)).atOffset(zone).toInstant())
                    ? day.atTime(java.time.LocalTime.of(nightStart, 0)).atOffset(zone) : start;
            var b = day.plusDays(1).atTime(java.time.LocalTime.of(nightEnd, 0)).atOffset(zone);
            if (end.isBefore(b)) b = end;
            if (b.isAfter(a)) total += (int) java.time.Duration.between(a, b).toMinutes();
            day = day.plusDays(1);
        }
        return total;
    }
}
