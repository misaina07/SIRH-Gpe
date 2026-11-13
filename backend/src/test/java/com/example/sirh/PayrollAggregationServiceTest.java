package com.example.sirh;

import com.example.sirh.service.EmployeeAccessService;
import com.example.sirh.service.PayrollAggregationService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PayrollAggregationServiceTest {
    @Test
    void rejectsPayrollExportForUnauthorizedActor() {
        EmployeeAccessService access = mock(EmployeeAccessService.class);
        PayrollAggregationService service = new PayrollAggregationService(mock(JdbcTemplate.class), access);
        Authentication actor = mock(Authentication.class);
        when(access.isHr(actor)).thenReturn(false);
        when(access.isFinance(actor)).thenReturn(false);

        assertThrows(RuntimeException.class, () -> service.variables("2026-11", actor));
    }

    @Test
    void exportsAggregatedVariablesAsSemicolonSeparatedCsv() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        EmployeeAccessService access = mock(EmployeeAccessService.class);
        Authentication actor = mock(Authentication.class);
        when(access.isHr(actor)).thenReturn(true);
        when(actor.getName()).thenReturn("usr-1");

        Map<String, Object> row = new HashMap<>();
        row.put("employee_id", 42);
        row.put("first_name", "Ada");
        row.put("last_name", "Lovelace");
        row.put("email_pro", "ada@example.test");
        row.put("period_month", "2026-11-01");
        row.put("overtime_25_minutes", 60);
        row.put("overtime_50_minutes", 30);
        row.put("unpaid_absence_days", new BigDecimal("1.5"));
        row.put("on_call_amount", new BigDecimal("125.00"));
        row.put("overtime_preference", "PAIEMENT");
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(row));

        byte[] result = new PayrollAggregationService(jdbc, access).csv("2026-11", actor);

        String expected = "employee_id;first_name;last_name;email;period_month;overtime_25_minutes;overtime_50_minutes;unpaid_absence_days;on_call_amount;overtime_preference\n"
            + "42;Ada;Lovelace;ada@example.test;2026-11-01;60;30;1.5;125.00;PAIEMENT\n";
        assertArrayEquals(expected.getBytes(java.nio.charset.StandardCharsets.UTF_8), result);
    }
}
