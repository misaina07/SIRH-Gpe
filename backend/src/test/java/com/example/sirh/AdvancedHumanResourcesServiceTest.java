package com.example.sirh;

import com.example.sirh.service.AdvancedHumanResourcesService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.EmptyResultDataAccessException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdvancedHumanResourcesServiceTest {
    private final AdvancedHumanResourcesService service =
            new AdvancedHumanResourcesService(new JdbcTemplate());

    @Test
    void calculatesStcNetAmount() {
        BigDecimal result = service.calculateStc(
                new BigDecimal("100000"),
                new BigDecimal("50000"),
                new BigDecimal("30000"),
                new BigDecimal("20000"),
                new BigDecimal("10000"),
                new BigDecimal("5000"));
        assertEquals(new BigDecimal("185000"), result);
    }

    @Test
    void detectsOverlappingCareerPeriods() {
        assertTrue(service.periodsOverlap(
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 12, 31)));
    }

    @Test
    void acceptsAdjacentCareerPeriods() {
        assertFalse(service.periodsOverlap(
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 12, 31)));
    }

    @Test
    void identifiesTrainingNeedFromSkillGap() {
        assertTrue(service.needsTraining(4, 2));
        assertFalse(service.needsTraining(4, 4));
    }

    @Test
    void resolvesExistingEmployeeByMatricule() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        AdvancedHumanResourcesService matriculeService = new AdvancedHumanResourcesService(jdbc);
        when(jdbc.queryForObject(
                eq("SELECT id FROM employees WHERE matricule = ?"),
                eq(Integer.class),
                eq("EMP-2026-0001")))
                .thenReturn(1);

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("matricule", "EMP-2026-0001");
        body.put("period", "2026");
        body.put("score", 3);
        body.put("comment", "Test");

        matriculeService.createEvaluation(body);

        verify(jdbc).queryForObject(
                eq("SELECT id FROM employees WHERE matricule = ?"),
                eq(Integer.class),
                eq("EMP-2026-0001"));
        verify(jdbc).update(
                eq("INSERT INTO evaluation(employee_id,periode,score,commentaire,statut) VALUES (?, ?, ?, ?, 'BROUILLON')"),
                eq(1), eq("2026"), eq(new BigDecimal("3")), eq("Test"));
    }

    @Test
    void rejectsUnknownMatriculeWithClearMessage() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        AdvancedHumanResourcesService matriculeService = new AdvancedHumanResourcesService(jdbc);
        when(jdbc.queryForObject(
                eq("SELECT id FROM employees WHERE matricule = ?"),
                eq(Integer.class),
                eq("EMP-INCONNU")))
                .thenThrow(new EmptyResultDataAccessException(1));

        Map<String, Object> body = Map.of(
                "matricule", "EMP-INCONNU",
                "period", "2026",
                "score", 3);

        IllegalArgumentException exception = org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> matriculeService.createEvaluation(body));
        assertEquals("Aucun employe trouve avec le matricule EMP-INCONNU.", exception.getMessage());
    }
}
