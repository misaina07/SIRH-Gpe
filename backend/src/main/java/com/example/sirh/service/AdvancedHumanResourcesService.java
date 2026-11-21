package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class AdvancedHumanResourcesService {
    private final JdbcTemplate jdbc;

    public AdvancedHumanResourcesService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> evaluations() {
        return jdbc.queryForList("SELECT e.id,e.employee_id,e.periode,e.score,e.commentaire,e.statut,e.created_at,"
                + " CONCAT(emp.first_name,' ',emp.last_name) AS employee_name, emp.matricule "
                + "FROM evaluation e LEFT JOIN employees emp ON emp.id=e.employee_id "
                + "ORDER BY e.created_at DESC");
    }

    public Map<String, Object> createEvaluation(Map<String, Object> body) {
        String matricule = text(body, "matricule");
        if (matricule == null || matricule.isBlank()) {
            throw new IllegalArgumentException("Le matricule de l'employe est obligatoire.");
        }

        Integer employeeId;
        try {
            employeeId = jdbc.queryForObject(
                    "SELECT id FROM employees WHERE matricule = ?",
                    Integer.class,
                    matricule.trim());
        } catch (org.springframework.dao.EmptyResultDataAccessException exception) {
            throw new IllegalArgumentException("Aucun employe trouve avec le matricule " + matricule.trim() + ".");
        }

        jdbc.update("INSERT INTO evaluation(employee_id,periode,score,commentaire,statut) VALUES (?, ?, ?, ?, 'BROUILLON')",
                employeeId, text(body, "period"), decimal(body, "score"), text(body, "comment"));
        return Map.of("ok", true);
    }

    public List<Map<String, Object>> career(Integer employeeId) {
        if (employeeId != null) {
            return jdbc.queryForList("SELECT 'AFFECTATION' AS type,id,poste AS libelle,date_debut,date_fin "
                    + "FROM historique_affectation WHERE employee_id=? "
                    + "UNION ALL "
                    + "SELECT 'SALARY' AS type,id,CAST(salaire_mensuel AS VARCHAR) AS libelle,date_debut,date_fin "
                    + "FROM historique_salaire WHERE employee_id=? ORDER BY date_debut",
                    employeeId, employeeId);
        }
        return jdbc.queryForList("SELECT id,employee_id,poste,date_debut,date_fin FROM historique_affectation ORDER BY date_debut DESC");
    }

    public Map<String, Object> createCareerEvent(Map<String, Object> body) {
        Integer employeeId = integer(body, "employeeId");
        String type = text(body, "type");
        LocalDate date = LocalDate.parse(text(body, "date"));
        if ("PROMOTION".equalsIgnoreCase(type)) {
            jdbc.update("INSERT INTO promotion(employee_id,nouveau_grade,date_effet,statut,commentaire) VALUES (?, ?, ?, 'BROUILLON', ?)",
                    employeeId, text(body, "grade"), date, text(body, "comment"));
        } else if ("MUTATION".equalsIgnoreCase(type)) {
            jdbc.update("INSERT INTO mutation(employee_id,nouveau_departement,nouveau_poste,date_effet,statut,commentaire) "
                            + "VALUES (?, ?, ?, ?, 'BROUILLON', ?)",
                    employeeId, text(body, "department"), text(body, "position"), date, text(body, "comment"));
        } else {
            throw new IllegalArgumentException("Type d'evenement inconnu.");
        }
        return Map.of("ok", true);
    }

    public List<Map<String, Object>> incidents() {
        return jdbc.queryForList("SELECT i.id,i.employee_id,i.objet,i.description,i.date_incident,i.statut,"
                + " CONCAT(emp.first_name,' ',emp.last_name) AS employee_name "
                + "FROM incident i LEFT JOIN employees emp ON emp.id=i.employee_id ORDER BY i.created_at DESC");
    }

    public Map<String, Object> createIncident(Map<String, Object> body) {
        jdbc.update("INSERT INTO incident(employee_id,objet,description,date_incident,statut) VALUES (?, ?, ?, ?, 'OUVERT')",
                integer(body, "employeeId"), text(body, "subject"), text(body, "description"),
                LocalDate.parse(text(body, "date")));
        return Map.of("ok", true);
    }

    public List<Map<String, Object>> offboarding() {
        return jdbc.queryForList("SELECT r.id,r.employee_id,r.motif,r.date_notification,r.date_sortie,r.duree_preavis_jours,r.statut,"
                + " CONCAT(emp.first_name,' ',emp.last_name) AS employee_name "
                + "FROM rupture r LEFT JOIN employees emp ON emp.id=r.employee_id ORDER BY r.date_sortie DESC");
    }

    public Map<String, Object> createOffboarding(Map<String, Object> body) {
        Integer employeeId = integer(body, "employeeId");
        String motif = text(body, "reason");
        LocalDate exitDate = LocalDate.parse(text(body, "exitDate"));
        jdbc.update("INSERT INTO rupture(employee_id,motif,date_notification,date_sortie,duree_preavis_jours,statut) "
                        + "VALUES (?, ?, ?, ?, ?, 'EN_COURS')",
                employeeId, motif, LocalDate.now(), exitDate, integer(body, "noticeDays"));
        return Map.of("ok", true);
    }

    public BigDecimal calculateStc(BigDecimal salaryDue, BigDecimal unusedLeave, BigDecimal notice,
                                   BigDecimal severance, BigDecimal advances, BigDecimal deductions) {
        return salaryDue.add(unusedLeave).add(notice).add(severance).subtract(advances).subtract(deductions);
    }

    public boolean periodsOverlap(LocalDate startA, LocalDate endA, LocalDate startB, LocalDate endB) {
        LocalDate effectiveEndA = endA == null ? LocalDate.of(9999, 12, 31) : endA;
        LocalDate effectiveEndB = endB == null ? LocalDate.of(9999, 12, 31) : endB;
        return !effectiveEndA.isBefore(startB) && !effectiveEndB.isBefore(startA);
    }

    public boolean needsTraining(int expected, int acquired) {
        return acquired < expected;
    }

    private Integer integer(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) throw new IllegalArgumentException("Champ obligatoire: " + key);
        return Integer.valueOf(value.toString());
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString());
    }
}
