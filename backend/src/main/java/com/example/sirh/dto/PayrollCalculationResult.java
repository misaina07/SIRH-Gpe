package com.example.sirh.dto;

import java.math.BigDecimal;
import java.util.List;

/** Résultat définitif du calcul d'un bulletin pour un salarié. */
public record PayrollCalculationResult(
        int employeeId,
        String matricule,
        String firstName,
        String lastName,
        BigDecimal monthlyBaseSalary,
        BigDecimal absenceDeduction,
        BigDecimal grossSalary,
        BigDecimal cnapsEmployee,
        BigDecimal cnapsEmployer,
        BigDecimal ostieEmployee,
        BigDecimal ostieEmployer,
        BigDecimal taxableIncome,
        BigDecimal irsa,
        BigDecimal totalDeductions,
        BigDecimal netSalary,
        BigDecimal employerCost,
        List<String> warnings,
        List<PayrollLine> lines
) {}
