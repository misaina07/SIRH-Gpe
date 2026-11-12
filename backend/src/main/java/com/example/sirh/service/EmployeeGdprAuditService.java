package com.example.sirh.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class EmployeeGdprAuditService {
    private final JdbcTemplate jdbc;

    public EmployeeGdprAuditService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void record(Authentication actor, Integer employeeId, String action, String category) {
        jdbc.update("""
                INSERT INTO gdpr_access_audit(actor_user_id,employee_id,action,data_category)
                VALUES (?,?,?,?)
                """, actor == null ? null : actor.getName(), employeeId, action, category);
    }
}
