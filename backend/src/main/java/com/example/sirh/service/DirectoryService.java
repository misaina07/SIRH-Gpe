package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Array;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DirectoryService {
    private final JdbcTemplate jdbc;

    public DirectoryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Map<String, Object>> users() {
        return jdbc.queryForList("""
            SELECT id, name, email, role_type AS \"roleType\", role_display_name AS role,
                   avatar_url AS avatar, initials, primary_department AS department,
                   allowed_views AS \"allowedViews\", can_validate_rh AS \"canValidateRH\",
                   can_validate_finance AS \"canValidateFinance\", can_validate_direction AS \"canValidateDirection\",
                   can_create_requisition AS \"canCreateRequisition\", can_manage_candidates AS \"canManageCandidates\",
                   ARRAY(SELECT md.department_id FROM manager_departments md WHERE md.manager_id=users.id ORDER BY md.department_id) AS \"managedDepartmentIds\",
                   ARRAY(SELECT d.name FROM manager_departments md JOIN departments d ON d.id=md.department_id WHERE md.manager_id=users.id ORDER BY d.name) AS \"managedDepartmentNames\"
            FROM users ORDER BY name
            """).stream().map(this::normalizeArrays).toList();
    }

    public List<Map<String, Object>> departments() {
        var departments = jdbc.queryForList("""
            SELECT d.id, d.code, d.name, d.short_name AS \"shortName\", d.category,
                   d.primary_manager_id AS \"primaryManagerId\", u.name AS \"primaryManagerName\",
                   u.role_display_name AS \"primaryManagerRole\", d.allocated_budget_annual AS \"allocatedBudgetAnnual\",
                   d.consumed_budget_annual AS \"consumedBudgetAnnual\", d.headcount_current AS \"headcountCurrent\",
                   d.headcount_target AS \"headcountTarget\",
                   (SELECT count(*) FROM available_positions p WHERE p.department_id=d.id AND p.status IN ('ouvert','en_validation')) AS \"openPositionsCount\"
            FROM departments d LEFT JOIN users u ON u.id=d.primary_manager_id ORDER BY d.name
            """);
        departments.forEach(d -> d.put("positions", positionsForDepartment((String)d.get("id"))));
        return departments;
    }

    public Map<String, Object> department(String id) {
        return departments().stream().filter(d -> id.equals(d.get("id"))).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Département introuvable : " + id));
    }

    public List<Map<String, Object>> positions() { return positionsForDepartment(null); }

    public List<Map<String, Object>> positionsForDepartment(String departmentId) {
        String sql = """
            SELECT p.id, p.title, p.department_id AS \"departmentId\", d.name AS \"departmentName\", d.code AS \"departmentCode\",
                   p.grade, p.contract_type AS \"contractType\", p.status, p.salary_min AS \"salaryMin\", p.salary_max AS \"salaryMax\",
                   p.salary_range_label AS \"salaryRange\", p.fte, p.priority, p.manager_id AS \"managerId\",
                   u.name AS \"managerName\", u.email AS \"managerEmail\", p.location,
                   to_char(p.target_date,'DD/MM/YYYY') AS \"targetDate\", p.requisition_code AS \"requisitionCode\",
                   p.description, p.skills
            FROM available_positions p JOIN departments d ON d.id=p.department_id JOIN users u ON u.id=p.manager_id
            """ + (departmentId == null ? "" : " WHERE p.department_id=?") + " ORDER BY p.created_at DESC";
        var rows = departmentId == null ? jdbc.queryForList(sql) : jdbc.queryForList(sql, departmentId);
        return rows.stream().map(this::normalizeArrays).toList();
    }

    public List<Map<String, Object>> requisitions(String departmentId, String status, String search, String managerId) {
        return requisitions(departmentId, status, search, managerId, null, null, null, null);
    }

    public List<Map<String, Object>> requisitions(String departmentId, String status, String search, String managerId,
            String priority, String contract, String budgetStatus, String salaryBand) {
        StringBuilder sql = new StringBuilder("""
            SELECT r.id, r.code, r.title, r.department_id AS \"departmentId\", d.name AS department,
                   d.code AS \"departmentCode\", r.priority, r.contract_type AS \"contractType\", r.location,
                   r.requester_name AS \"requesterName\", r.requester_role AS \"requesterRole\",
                   to_char(r.creation_date,'DD/MM/YYYY') AS \"creationDate\", to_char(r.target_start_date,'DD/MM/YYYY') AS \"targetStartDate\",
                   r.reason, r.status, r.salary_min AS \"salaryMin\", r.salary_max AS \"salaryMax\", r.currency,
                   r.grade, r.grade_min AS \"gradeMin\", r.grade_max AS \"gradeMax\",
                   r.department_limit_min AS \"departmentLimitMin\", r.department_limit_max AS \"departmentLimitMax\",
                   r.annual_employer_budget AS \"annualEmployerBudget\", r.current_step AS \"currentStep\",
                   manager.name AS \"managerInCharge\", r.budget_variance_status AS \"budgetVarianceStatus\",
                   r.derogation_motive AS \"derogationMotive\", r.rh_observations AS \"rhObservations\",
                   r.rh_check_fiche AS \"rhCheckFiche\", r.rh_check_grade AS \"rhCheckGrade\", r.rh_check_coherence AS \"rhCheckCoherence\"
            FROM requisitions r JOIN departments d ON d.id=r.department_id
            LEFT JOIN users manager ON manager.id=r.manager_in_charge_id
            WHERE 1=1
            """);
        List<Object> params = new ArrayList<>();
        if (departmentId != null && !departmentId.isBlank()) {
            sql.append(" AND r.department_id=?");
            params.add(departmentId);
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND r.status=?");
            params.add(status);
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND lower(concat_ws(' ',r.code,r.title,r.requester_name,d.name)) LIKE lower(?)");
            params.add("%" + search + "%");
        }
        if (managerId != null) {
            sql.append(" AND EXISTS (SELECT 1 FROM manager_departments md WHERE md.manager_id=? AND md.department_id=r.department_id)");
            params.add(managerId);
        }
        if (priority != null && !priority.isBlank()) { sql.append(" AND r.priority=?"); params.add(priority); }
        if (contract != null && !contract.isBlank()) { sql.append(" AND lower(r.contract_type) LIKE lower(?)"); params.add("%" + contract + "%"); }
        if (budgetStatus != null && !budgetStatus.isBlank()) { sql.append(" AND r.budget_variance_status=?"); params.add(budgetStatus); }
        if (salaryBand != null && !salaryBand.isBlank()) {
            switch (salaryBand) {
                case "low" -> sql.append(" AND r.salary_max <= 3200");
                case "mid" -> sql.append(" AND r.salary_max > 3200 AND r.salary_max <= 3700");
                case "high" -> sql.append(" AND r.salary_max > 3700");
                default -> throw new IllegalArgumentException("Tranche salariale inconnue.");
            }
        }
        sql.append(" ORDER BY r.creation_date DESC, r.code");
        return jdbc.queryForList(sql.toString(), params.toArray());
    }

    public List<Map<String, Object>> candidates() {
        return jdbc.queryForList("""
            SELECT id, full_name AS name, initials, role_title AS \"roleTitle\", experience_years AS \"experienceYears\",
                   score, skills, kanban_stage AS stage, received_days_ago AS \"receivedDaysAgo\", status_badge AS \"statusBadge\",
                   milestone, sla, notes, rejection_reason AS \"rejectionReason\", salary_expectation AS \"salaryExpectation\"
            FROM candidates c
            WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.source_candidate_id=c.id)
            ORDER BY applied_at DESC
            """).stream().map(this::normalizeArrays).toList();
    }

    public Map<String, Object> candidate(String id) {
        return candidates().stream().filter(candidate -> id.equals(candidate.get("id"))).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable : " + id));
    }

    @Transactional
    public void changeCandidateStage(String id, String stage, String reason) {
        if (!List.of("recue", "preselectionne", "entretien", "retenu", "refuse").contains(stage))
            throw new IllegalArgumentException("Étape Kanban inconnue.");
        var candidate = jdbc.queryForMap("SELECT kanban_stage FROM candidates WHERE id=? FOR UPDATE", id);
        String current = (String) candidate.get("kanban_stage");
        if (current.equals("retenu") || current.equals("refuse"))
            throw new WorkflowConflictException("Un candidat clôturé ne peut plus changer d’étape.");
        if ("refuse".equals(stage) && (reason == null || reason.isBlank()))
            throw new IllegalArgumentException("Un motif est obligatoire pour refuser un candidat.");
        List<String> flow = List.of("recue", "preselectionne", "entretien", "retenu");
        if (!"refuse".equals(stage) && flow.indexOf(stage) != flow.indexOf(current) + 1)
            throw new WorkflowConflictException("La transition Kanban demandée n’est pas autorisée.");
        jdbc.update("UPDATE candidates SET kanban_stage=?,rejection_reason=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                stage, "refuse".equals(stage) ? reason.trim() : null, id);
    }

    public List<Map<String, Object>> onboarding() {
        return jdbc.queryForList("""
            SELECT id, full_name AS name, initials, department_name AS department, role_title AS \"roleTitle\",
                   days_remaining AS \"daysRemaining\", to_char(arrival_date,'DD/MM/YYYY') AS \"arrivalDate\",
                   tasks_done AS \"tasksDone\", tasks_total AS \"tasksTotal\", color_scheme AS \"colorScheme\"
            FROM onboarding_people ORDER BY arrival_date
            """);
    }

    private Map<String, Object> normalizeArrays(Map<String, Object> row) {
        row.replaceAll((key, value) -> value instanceof Array array ? arrayToList(array) : value);
        return row;
    }

    private Object arrayToList(Array array) {
        try { return List.of((Object[]) array.getArray()); }
        catch (SQLException e) { throw new IllegalStateException("Lecture d'une liste PostgreSQL impossible", e); }
    }
}
