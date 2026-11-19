package com.example.sirh.dto;

import java.math.BigDecimal;

/** Une seule ligne additionnée au bulletin : gain ou retenue. */
public record PayrollLine(
        String code,
        String label,
        String type,
        BigDecimal quantity,
        BigDecimal rate,
        BigDecimal amount
) {}
