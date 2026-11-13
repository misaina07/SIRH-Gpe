package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeAccessService {
    private final JdbcTemplate jdbc;

    public EmployeeAccessService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public boolean has(Authentication actor, String authority) {
        return actor != null && actor.getAuthorities().stream().anyMatch(granted -> authority.equals(granted.getAuthority()));
    }

    public boolean isHr(Authentication actor) { return has(actor, "ROLE_RH"); }
    public boolean isFinance(Authentication actor) { return has(actor, "ROLE_Finance"); }
    public boolean isDirection(Authentication actor) { return has(actor, "ROLE_Direction"); }
    public boolean isManager(Authentication actor) { return has(actor, "ROLE_Manager"); }
    public boolean isEmployee(Authentication actor) { return has(actor, "ROLE_Employee"); }

    public void requireHr(Authentication actor) {
        if (!isHr(actor)) throw new ForbiddenOperationException("Action réservée aux ressources humaines.");
    }

    public void requireProfileRead(Authentication actor) {
        if (!isHr(actor) && !isDirection(actor) && !isManager(actor) && !isEmployee(actor))
            throw new ForbiddenOperationException("Consultation des dossiers salariés non autorisée.");
    }

    public void requireDepartmentScope(Authentication actor, String departmentId) {
        if (isManager(actor) && jdbc.queryForObject("""
                SELECT count(*) FROM manager_departments WHERE manager_id=? AND department_id=?
                """, Integer.class, actor.getName(), departmentId) == 0)
            throw new ForbiddenOperationException("Vous ne gérez pas ce département.");
    }

    public List<String> managedDepartments(Authentication actor) {
        return jdbc.queryForList("SELECT department_id FROM manager_departments WHERE manager_id=? ORDER BY department_id",
                String.class, actor.getName());
    }
}
