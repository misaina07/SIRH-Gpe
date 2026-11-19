package com.example.sirh.dto;

import java.math.BigDecimal;
import java.util.*;
 public record PayrollBaseResult(
            BigDecimal monthlyBase,
            BigDecimal absenceDeduction,
            BigDecimal monthlyBaseAfterAbsence,
            BigDecimal hourlyRate,
            List<PayrollLine> lines
    ) {}
