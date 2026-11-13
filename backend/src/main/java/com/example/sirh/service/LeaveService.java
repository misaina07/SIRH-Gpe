package com.example.sirh.service;

import com.example.sirh.dto.CreateLeaveRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class LeaveService {
    private final JdbcTemplate jdbc;

    public LeaveService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> types() {
        return jdbc.queryForList("""
            SELECT id, name, requires_justification AS "requiresJustification"
            FROM leave_types ORDER BY name
            """);
    }

    public List<Map<String, Object>> balances(String actorId, int year) {
        String employeeId = employeeId(actorId);
        return jdbc.queryForList("""
            SELECT b.id, b.employee_id AS "employeeId", b.leave_type_id AS "leaveTypeId",
                   t.name AS "leaveTypeName", b.period_year AS year,
                   b.acquired_days AS "acquiredDays", b.taken_days AS "takenDays",
                   b.remaining_days AS "remainingDays"
            FROM leave_balances b
            JOIN leave_types t ON t.id=b.leave_type_id
            WHERE b.employee_id=? AND b.period_year=?
            ORDER BY t.name
            """, employeeId, year);
    }

    public List<Map<String, Object>> requests(String actorId, boolean managerView) {
        String sql = """
            SELECT r.id, r.employee_id AS "employeeId",
                   concat(e.first_name, ' ', e.last_name) AS "employeeName",
                   e.department_id AS "departmentId", d.name AS "departmentName",
                   r.leave_type_id AS "leaveTypeId", t.name AS "leaveTypeName",
                   r.start_date AS "startDate", r.end_date AS "endDate",
                   r.total_business_days AS "totalBusinessDays", r.status,
                   r.rejection_reason AS "rejectionReason",
                   r.justification_file_url AS "justificationFileUrl",
                   r.created_at AS "createdAt"
            FROM leave_requests r
            JOIN employees e ON e.id=r.employee_id
            JOIN departments d ON d.id=e.department_id
            JOIN leave_types t ON t.id=r.leave_type_id
            WHERE %s
            ORDER BY r.created_at DESC
            """;
        if (!managerView) {
            return jdbc.queryForList(sql.formatted("e.user_id=?"), actorId);
        }
        return jdbc.queryForList(sql.formatted("""
            e.department_id IN (
                SELECT department_id FROM manager_departments WHERE manager_id=?
            ) OR ? IN (SELECT id FROM users WHERE role_type='RH')
            """), actorId, actorId);
    }

    @Transactional
    public Map<String, Object> create(String actorId, CreateLeaveRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("La date de fin doit être postérieure ou égale à la date de début.");
        }
        int days = businessDays(request.startDate(), request.endDate());
        if (days == 0) {
            throw new IllegalArgumentException("La période doit contenir au moins un jour ouvré.");
        }

        String employeeId = employeeId(actorId);
        var type = jdbc.queryForMap(
                "SELECT id, requires_justification FROM leave_types WHERE id=?", request.leaveTypeId());
        if (Boolean.TRUE.equals(type.get("requires_justification"))
                && (request.justificationFileUrl() == null || request.justificationFileUrl().isBlank())) {
            throw new IllegalArgumentException("Un justificatif est obligatoire pour ce type d'absence.");
        }

        int year = request.startDate().getYear();
        var balance = jdbc.queryForMap("""
            SELECT remaining_days FROM leave_balances
            WHERE employee_id=? AND leave_type_id=? AND period_year=? FOR UPDATE
            """, employeeId, request.leaveTypeId(), year);
        Number remaining = (Number) balance.get("remaining_days");
        if (remaining.doubleValue() < days) {
            throw new WorkflowConflictException("Le solde disponible est insuffisant pour cette demande.");
        }

        Integer overlap = jdbc.queryForObject("""
            SELECT count(*) FROM leave_requests
            WHERE employee_id=? AND status='en_attente'
              AND start_date <= ? AND end_date >= ?
            """, Integer.class, employeeId, request.endDate(), request.startDate());
        if (overlap != null && overlap > 0) {
            throw new WorkflowConflictException("La période chevauche déjà une demande en attente.");
        }

        int id = jdbc.queryForObject("""
            INSERT INTO leave_requests(employee_id, leave_type_id, start_date, end_date,
                total_business_days, status, justification_file_url)
            VALUES (?, ?, ?, ?, ?, 'en_attente', ?)
            RETURNING id
            """, Integer.class, employeeId, request.leaveTypeId(), request.startDate(), request.endDate(),
                days, blankToNull(request.justificationFileUrl()));
        return jdbc.queryForMap("""
            SELECT id, leave_type_id AS "leaveTypeId", start_date AS "startDate",
                   end_date AS "endDate", total_business_days AS "totalBusinessDays", status
            FROM leave_requests WHERE id=?
            """, id);
    }

    @Transactional
    public void decide(String actorId, int requestId, boolean approved, String rejectionReason) {
        var request = jdbc.queryForMap("""
            SELECT r.employee_id, r.leave_type_id, r.start_date, r.end_date,
                   r.total_business_days, r.status, e.department_id
            FROM leave_requests r JOIN employees e ON e.id=r.employee_id
            WHERE r.id=? FOR UPDATE
            """, requestId);
        if (!"en_attente".equals(request.get("status"))) {
            throw new WorkflowConflictException("Cette demande a déjà été traitée.");
        }
        if (!canDecide(actorId, (String) request.get("department_id"))) {
            throw new ForbiddenOperationException("Vous n'êtes pas habilité à valider cette demande.");
        }
        if (!approved && (rejectionReason == null || rejectionReason.isBlank())) {
            throw new IllegalArgumentException("Un motif est obligatoire pour refuser une demande.");
        }

        if (approved) {
            jdbc.update("""
                UPDATE leave_balances
                SET taken_days=taken_days+?, remaining_days=remaining_days-?
                WHERE employee_id=? AND leave_type_id=? AND period_year=?
                """, request.get("total_business_days"), request.get("total_business_days"),
                    request.get("employee_id"), request.get("leave_type_id"),
                    toLocalDate(request.get("start_date")).getYear());
        }
        jdbc.update("""
            UPDATE leave_requests SET status=?, rejection_reason=? WHERE id=?
            """, approved ? "approuve" : "refuse", approved ? null : rejectionReason.trim(), requestId);
    }

    private boolean canDecide(String actorId, String departmentId) {
        Integer rh = jdbc.queryForObject("SELECT count(*) FROM users WHERE id=? AND role_type='RH'", Integer.class, actorId);
        if (rh != null && rh > 0) return true;
        Integer manager = jdbc.queryForObject("""
            SELECT count(*) FROM manager_departments WHERE manager_id=? AND department_id=?
            """, Integer.class, actorId, departmentId);
        return manager != null && manager > 0;
    }

    private String employeeId(String actorId) {
        return jdbc.queryForObject("SELECT id::text FROM employees WHERE user_id=?", String.class, actorId);
    }

    public static int businessDays(LocalDate start, LocalDate end) {
        int days = 0;
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) days++;
        }
        return days;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) return date;
        if (value instanceof java.sql.Date date) return date.toLocalDate();
        throw new IllegalStateException("Date de congé invalide retournée par la base.");
    }
}
