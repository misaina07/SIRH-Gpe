package com.example.sirh;

import com.example.sirh.controller.LeaveController.LeaveRequestBody;
import com.example.sirh.service.EmployeeCoreService;
import com.example.sirh.service.ForbiddenOperationException;
import com.example.sirh.service.LeaveManagementService;
import com.example.sirh.service.TimeTrackingService;
import com.example.sirh.service.WorkflowConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class OperationalFlowPostgresTest {
    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TimeTrackingService timeTracking;

    @Autowired
    private LeaveManagementService leaves;

    @Autowired
    private EmployeeCoreService employees;

    @Test
    void postgresContainsOperationalMigrations() {
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM information_schema.tables WHERE table_name='employee_contracts'", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM information_schema.tables WHERE table_name='time_regularization_requests'", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM information_schema.tables WHERE table_name='leave_accrual_ledger'", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM information_schema.tables WHERE table_name='payroll_monthly_variables'", Integer.class));
    }

    @Test
    @Transactional
    void employeeCanUseTimeTrackingAndSubmitLeaveThroughPostgres() {
        Fixture fixture = fixture();
        Integer employeeId = fixture.employeeId();
        var actor = fixture.actor();

        var clockEvent = timeTracking.record("IN", UUID.randomUUID(), actor);
        assertTrue(clockEvent.containsKey("id"));
        assertThrows(WorkflowConflictException.class, () -> timeTracking.record("OUT", UUID.randomUUID(), actor));

        var request = new LeaveRequestBody(
            "SANS_SOLDE",
            LocalDate.of(2099, 1, 5),
            LocalDate.of(2099, 1, 5),
            "FULL",
            "FULL",
            "Test d'integration PostgreSQL"
        );
        var leave = leaves.submit(request, null, actor);
        assertEquals(employeeId, leave.get("employee_id"));
        assertEquals("en_attente_manager", leave.get("status"));
    }

    @Test
    @Transactional
    void rejectsOverlappingLeaveAndAuditsEmployeeProfileRead() {
        Fixture fixture = fixture();
        var request = new LeaveRequestBody("SANS_SOLDE", LocalDate.of(2099, 2, 2), LocalDate.of(2099, 2, 3), "FULL", "FULL", "Overlap test");
        leaves.submit(request, null, fixture.actor());

        assertThrows(WorkflowConflictException.class, () -> leaves.submit(request, null, fixture.actor()));
        employees.get(fixture.employeeId(), fixture.actor());
        assertTrue(jdbc.queryForObject("SELECT count(*) FROM gdpr_access_audit WHERE employee_id=? AND action='READ'", Integer.class, fixture.employeeId()) > 0);
        var otherEmployee = new UsernamePasswordAuthenticationToken("other-user", "ignored", List.of(new SimpleGrantedAuthority("ROLE_Employee")));
        assertThrows(ForbiddenOperationException.class, () -> employees.get(fixture.employeeId(), otherEmployee));
    }

    private Fixture fixture() {
        String userId = "it-flow-user";
        if (jdbc.queryForObject("SELECT count(*) FROM users WHERE id=?", Integer.class, userId) == 0) {
            String departmentId = jdbc.queryForObject("SELECT id FROM departments ORDER BY id LIMIT 1", String.class);
            jdbc.update("INSERT INTO users(id,name,email,role_type,role_display_name,initials,primary_department) VALUES(?,?,?,?,?,?,?)",
                userId, "Integration Employee", "it-flow@example.test", "Employee", "Employee", "IE", departmentId);
            jdbc.update("""
                INSERT INTO employees(matricule,user_id,first_name,last_name,email_pro,birth_date,hire_date,
                                      department_id,contract_type,monthly_salary,status)
                VALUES(?,?,?,?,?,?,?,?,?,?, 'actif')
                """, "IT-FLOW", userId, "Integration", "Employee", "it-flow@example.test",
                LocalDate.of(1990, 1, 1), LocalDate.now(), departmentId, "CDI", 3000);
        }
        Integer employeeId = jdbc.queryForObject("SELECT id FROM employees WHERE user_id=? AND status='actif'", Integer.class, userId);
        return new Fixture(employeeId, new UsernamePasswordAuthenticationToken(userId, "ignored",
            List.of(new SimpleGrantedAuthority("ROLE_Employee"))));
    }

    private record Fixture(int employeeId, UsernamePasswordAuthenticationToken actor) {}
}
