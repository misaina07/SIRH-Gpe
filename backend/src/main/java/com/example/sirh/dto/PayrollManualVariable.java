package com.example.sirh.dto;

import java.math.BigDecimal;

/** Valeur saisie manuellement pour une rubrique de paie. */
public record PayrollManualVariable(
        String rubriqueCode,
        String label,
        String type,
        BigDecimal quantity,
        BigDecimal amount,
        Integer week
) {}
