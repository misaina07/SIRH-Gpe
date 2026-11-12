package com.example.sirh.service;

import com.example.sirh.dto.CreateRequisitionRequest;
import com.example.sirh.dto.FinanceValidationRequest;
import com.example.sirh.dto.RhValidationRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

@Service
public class RequisitionWorkflowService {
    private final JdbcTemplate jdbc;
    private final BudgetCalculationService budgets;

    public RequisitionWorkflowService(JdbcTemplate jdbc, BudgetCalculationService budgets) {
        this.jdbc = jdbc; this.budgets = budgets;
    }

    @Transactional
    public String create(CreateRequisitionRequest request, Authentication actor) {
        require(actor, "CAN_CREATE_REQUISITION");
        if (request.salaryMin().compareTo(request.salaryMax()) > 0)
            throw new IllegalArgumentException("Le salaire minimum doit être inférieur ou égal au salaire maximum.");
        if (!request.targetStartDate().isAfter(LocalDate.now()))
            throw new IllegalArgumentException("La date de prise de poste doit être future.");
        String userId = actor.getName();
        var user = jdbc.queryForMap("SELECT name, role_display_name FROM users WHERE id=?", userId);
        if (jdbc.queryForObject("SELECT count(*) FROM manager_departments WHERE manager_id=? AND department_id=?",
                Integer.class, userId, request.departmentId()) == 0)
            throw new ForbiddenOperationException("Vous n'êtes pas autorisé à créer une demande pour ce département.");
        var department = jdbc.queryForMap("SELECT allocated_budget_annual, consumed_budget_annual FROM departments WHERE id=?", request.departmentId());
        BudgetCalculationService.BudgetResult budget = budgets.calculate(request.salaryMax(),
                (java.math.BigDecimal) department.get("allocated_budget_annual"),
                (java.math.BigDecimal) department.get("consumed_budget_annual"));

        jdbc.execute("SELECT pg_advisory_xact_lock(8315042)");
        int next = jdbc.queryForObject("""
            SELECT COALESCE(MAX(CAST(substring(code from '[0-9]+$') AS INTEGER)), 0) + 1
            FROM requisitions WHERE code LIKE ?
            """, Integer.class, "REQ-" + LocalDate.now().getYear() + "-%");
        String code = "REQ-" + LocalDate.now().getYear() + "-" + String.format("%04d", next);
        String id = "req-" + String.format("%04d", next);
        boolean submit = Boolean.TRUE.equals(request.submit());
        jdbc.update("""
            INSERT INTO requisitions (id,code,title,department_id,priority,manager_in_charge_id,budget_variance_status,
              contract_type,location,requester_name,requester_role,creation_date,target_start_date,reason,status,
              salary_min,salary_max,currency,grade,annual_employer_budget,current_step)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,?, 'EUR',?,?,?)
            """, id, code, request.title(), request.departmentId(), request.priority(), userId, budget.status(),
                request.contractType(), request.location(), user.get("name"), user.get("role_display_name"),
                LocalDate.now(), request.targetStartDate(), request.reason(), submit ? "en_cours_rh" : "brouillon",
                request.salaryMin(), request.salaryMax(), request.grade(), budget.annualCost(), submit ? 2 : 1);
        jdbc.update("INSERT INTO requisition_approvals(requisition_id,step_name,status) VALUES (?,?,'en_attente'),(?,?,'en_attente'),(?,?,'en_attente')",
                id, "QUALIFICATION_RH", id, "ARBITRAGE_FINANCE", id, "APPROBATION_DIRECTION");
        audit(id, submit ? "Soumission de la demande" : "Enregistrement du brouillon", user.get("name").toString(),
                user.get("role_display_name").toString(), submit ? "Demande soumise pour qualification RH." : "Brouillon enregistré.", "primary");
        return id;
    }

    @Transactional
    public void resubmit(String requisitionId, CreateRequisitionRequest request, Authentication actor) {
        require(actor, "CAN_CREATE_REQUISITION");
        if (request.salaryMin().compareTo(request.salaryMax()) > 0)
            throw new IllegalArgumentException("Le salaire minimum doit être inférieur ou égal au salaire maximum.");
        if (!request.targetStartDate().isAfter(LocalDate.now()))
            throw new IllegalArgumentException("La date de prise de poste doit être future.");
        var existing = requisitionForUpdate(requisitionId, "brouillon");
        if (!actor.getName().equals(existing.get("manager_in_charge_id")))
            throw new ForbiddenOperationException("Seul le manager demandeur peut corriger cette demande.");
        if (jdbc.queryForObject("SELECT count(*) FROM manager_departments WHERE manager_id=? AND department_id=?",
                Integer.class, actor.getName(), request.departmentId()) == 0)
            throw new ForbiddenOperationException("Vous n'êtes pas autorisé à utiliser ce département.");
        var department = jdbc.queryForMap("SELECT allocated_budget_annual,consumed_budget_annual FROM departments WHERE id=?", request.departmentId());
        var budget = budgets.calculate(request.salaryMax(), (java.math.BigDecimal)department.get("allocated_budget_annual"),
                (java.math.BigDecimal)department.get("consumed_budget_annual"));
        jdbc.update("""
            UPDATE requisitions SET title=?,department_id=?,priority=?,budget_variance_status=?,contract_type=?,location=?,
              target_start_date=?,reason=?,salary_min=?,salary_max=?,grade=?,annual_employer_budget=?,status=?,
              current_step=?,updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, request.title(), request.departmentId(), request.priority(), budget.status(), request.contractType(),
                request.location(), request.targetStartDate(), request.reason(), request.salaryMin(), request.salaryMax(),
                request.grade(), budget.annualCost(), Boolean.TRUE.equals(request.submit()) ? "en_cours_rh" : "brouillon",
                Boolean.TRUE.equals(request.submit()) ? 2 : 1, requisitionId);
        jdbc.update("""
            UPDATE requisition_approvals SET validator_id=NULL,status='en_attente',comments=NULL,validated_at=NULL
            WHERE requisition_id=?
            """, requisitionId);
        audit(requisitionId, "Correction du manager", actorName(actor), actorRole(actor),
                "Demande corrigée et soumise à nouveau à la qualification RH.", "primary");
    }

    @Transactional
    public void validateRh(String requisitionId, RhValidationRequest request, Authentication actor) {
        require(actor, "CAN_VALIDATE_RH");
        var requisition = requisitionForUpdate(requisitionId, "en_cours_rh");
        if (actor.getName().equals(requisition.get("manager_in_charge_id")))
            throw new ForbiddenOperationException("Le demandeur ne peut pas valider sa propre demande.");
        if (request.approved() && (!request.checkFiche() || !request.checkGrade() || !request.checkCoherence()))
            throw new IllegalArgumentException("Les trois contrôles RH doivent être validés.");
        jdbc.update("UPDATE requisitions SET rh_check_fiche=?,rh_check_grade=?,rh_check_coherence=? WHERE id=?", request.checkFiche(), request.checkGrade(), request.checkCoherence(), requisitionId);
        if (!request.approved()) {
            jdbc.update("""
                UPDATE requisition_approvals SET validator_id=?,status='refuse',comments=?,validated_at=CURRENT_TIMESTAMP
                WHERE requisition_id=? AND step_name='QUALIFICATION_RH'
                """, actor.getName(), request.observations(), requisitionId);
            jdbc.update("UPDATE requisitions SET status='brouillon',current_step=1,rh_observations=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    request.observations(), requisitionId);
            audit(requisitionId, "Retour RH au manager", actorName(actor), actorRole(actor), request.observations(), "amber");
            return;
        }
        jdbc.update("""
            UPDATE requisition_approvals SET validator_id=?, status='approuve', comments=?, validated_at=CURRENT_TIMESTAMP
            WHERE requisition_id=? AND step_name='QUALIFICATION_RH'
            """, actor.getName(), request.observations(), requisitionId);
        jdbc.update("""
            UPDATE requisitions SET status='en_cours_finance', current_step=3, rh_observations=?,
              rh_check_fiche=true, rh_check_grade=true, rh_check_coherence=true, updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, request.observations(), requisitionId);
        audit(requisitionId, "Qualification RH", actorName(actor), actorRole(actor), request.observations(), "emerald");
    }

    @Transactional
    public void validateFinance(String requisitionId, FinanceValidationRequest request, Authentication actor) {
        require(actor, "CAN_VALIDATE_FINANCE");
        var requisition = requisitionForUpdate(requisitionId, "en_cours_finance");
        if (jdbc.queryForObject("SELECT count(*) FROM requisition_approvals WHERE requisition_id=? AND step_name='QUALIFICATION_RH' AND status='approuve'",
                Integer.class, requisitionId) == 0)
            throw new WorkflowConflictException("La validation RH est obligatoire avant Finance.");
        var department = jdbc.queryForMap("SELECT d.allocated_budget_annual,d.consumed_budget_annual FROM departments d WHERE d.id=?",
                requisition.get("department_id"));
        var budget = budgets.calculate((java.math.BigDecimal) requisition.get("salary_max"),
                (java.math.BigDecimal) department.get("allocated_budget_annual"),
                (java.math.BigDecimal) department.get("consumed_budget_annual"));
        if (request.approved() && !"conforme".equals(budget.status()) && (request.derogationMotive() == null || request.derogationMotive().isBlank()))
            throw new IllegalArgumentException("Un motif de dérogation est requis lorsque le budget dépasse le disponible.");
        if (!request.approved()) {
            jdbc.update("""
                UPDATE requisition_approvals SET validator_id=?,status='refuse',comments=?,validated_at=CURRENT_TIMESTAMP
                WHERE requisition_id=? AND step_name='ARBITRAGE_FINANCE'
                """, actor.getName(), request.comments(), requisitionId);
            jdbc.update("UPDATE requisitions SET status='brouillon',current_step=1,rh_observations=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", request.comments(), requisitionId);
            audit(requisitionId, "Retour Finance au manager", actorName(actor), actorRole(actor), request.comments(), "amber");
            return;
        }
        jdbc.update("""
            UPDATE requisition_approvals SET validator_id=?, status='approuve', comments=?, validated_at=CURRENT_TIMESTAMP
            WHERE requisition_id=? AND step_name='ARBITRAGE_FINANCE'
            """, actor.getName(), request.comments(), requisitionId);
        jdbc.update("""
            UPDATE requisitions SET status='en_cours_direction', current_step=4, budget_variance_status=?,
              annual_employer_budget=?, derogation_motive=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
            """, budget.status(), budget.annualCost(), request.derogationMotive(), requisitionId);
        audit(requisitionId, "Arbitrage Finance", actorName(actor), actorRole(actor), request.comments(), "emerald");
    }

    @Transactional
    public void approveDirection(String requisitionId, com.example.sirh.dto.DirectionApprovalRequest request, Authentication actor) {
        require(actor, "CAN_VALIDATE_DIRECTION");
        var requisition = requisitionForUpdate(requisitionId, "en_cours_direction");
        if (jdbc.queryForObject("SELECT count(*) FROM requisition_approvals WHERE requisition_id=? AND step_name='ARBITRAGE_FINANCE' AND status='approuve'",
                Integer.class, requisitionId) == 0)
            throw new WorkflowConflictException("La validation Finance est obligatoire avant l'approbation Direction.");
        if (!request.approved()) {
            jdbc.update("""
                UPDATE requisition_approvals SET validator_id=?,status='refuse',comments=?,validated_at=CURRENT_TIMESTAMP
                WHERE requisition_id=? AND step_name='APPROBATION_DIRECTION'
                """, actor.getName(), request.comments(), requisitionId);
            jdbc.update("UPDATE requisitions SET status='brouillon',current_step=1,updated_at=CURRENT_TIMESTAMP WHERE id=?", requisitionId);
            audit(requisitionId, "Retour Direction au manager", actorName(actor), actorRole(actor), request.comments(), "amber");
            return;
        }
        if (request.positionId() == null || request.positionId().isBlank())
            throw new IllegalArgumentException("Sélectionnez un poste existant à rattacher à la demande.");
        var rows = jdbc.queryForList("SELECT * FROM available_positions WHERE id=? FOR UPDATE", request.positionId());
        if (rows.isEmpty()) throw new ResourceNotFoundException("Poste introuvable : " + request.positionId());
        var position = rows.getFirst();
        boolean linkedAlready = requisition.get("code").equals(position.get("requisition_code"));
        boolean matches = requisition.get("department_id").equals(position.get("department_id"))
                && requisition.get("title").equals(position.get("title"))
                && requisition.get("grade").equals(position.get("grade"))
                && requisition.get("contract_type").equals(position.get("contract_type"))
                && ((java.math.BigDecimal)requisition.get("salary_min")).compareTo((java.math.BigDecimal)position.get("salary_min")) == 0
                && ((java.math.BigDecimal)requisition.get("salary_max")).compareTo((java.math.BigDecimal)position.get("salary_max")) == 0;
        if (!matches || (!linkedAlready && position.get("requisition_code") != null))
            throw new WorkflowConflictException("Le poste choisi ne correspond pas à la demande ou est déjà rattaché.");
        jdbc.update("UPDATE available_positions SET requisition_code=?,status='ouvert',updated_at=CURRENT_TIMESTAMP WHERE id=?",
                requisition.get("code"), request.positionId());
        jdbc.update("""
            UPDATE requisition_approvals SET validator_id=?,status='approuve',comments=?,validated_at=CURRENT_TIMESTAMP
            WHERE requisition_id=? AND step_name='APPROBATION_DIRECTION'
            """, actor.getName(), request.comments(), requisitionId);
        jdbc.update("UPDATE requisitions SET status='publiee',current_step=4,updated_at=CURRENT_TIMESTAMP WHERE id=?", requisitionId);
        audit(requisitionId, "Approbation Direction", actorName(actor), actorRole(actor), request.comments(), "emerald");
    }

    private java.util.Map<String, Object> requisitionForUpdate(String id, String requiredStatus) {
        var rows = jdbc.queryForList("SELECT * FROM requisitions WHERE id=? FOR UPDATE", id);
        if (rows.isEmpty()) throw new ResourceNotFoundException("Demande introuvable : " + id);
        var row = rows.getFirst();
        if (!requiredStatus.equals(row.get("status")))
            throw new WorkflowConflictException("La demande n'est pas à l'étape attendue.");
        return row;
    }

    private void audit(String reqId, String step, String name, String role, String quote, String color) {
        jdbc.update("""
            INSERT INTO requisition_audit_events(id,requisition_id,step_name,author_name,author_title,display_date,quote,color)
            VALUES (?,?,?,?,?,?,?,?)
            """, "aud-" + Instant.now().toEpochMilli() + UUID.randomUUID().toString().substring(0, 8), reqId, step, name, role,
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.FRENCH)), quote, color);
    }

    private void require(Authentication actor, String authority) {
        if (actor == null || actor.getAuthorities().stream().noneMatch(a -> authority.equals(a.getAuthority())))
            throw new ForbiddenOperationException("Permission insuffisante : " + authority);
    }
    private String actorName(Authentication actor) { return jdbc.queryForObject("SELECT name FROM users WHERE id=?", String.class, actor.getName()); }
    private String actorRole(Authentication actor) { return jdbc.queryForObject("SELECT role_display_name FROM users WHERE id=?", String.class, actor.getName()); }
}
