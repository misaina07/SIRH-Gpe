package com.example.sirh.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Toutes les données collectées nécessaires au moteur de calcul d'un salarié. */
public record PayrollInput(
        int employeeId,
        String matricule,
        String firstName,
        String lastName,
        BigDecimal monthlyBaseSalary,
        BigDecimal fixedBonus,
        BigDecimal variableBonus,
        String workRegime,
        String grade,
        LocalDate contractStartDate,
        LocalDate contractEndDate,
        int effectiveWorkedMinutes,
        int overtime25Minutes,
        int overtime50Minutes,
        int nightMinutes,
        int sundayMinutes,
        int holidayMinutes,
        BigDecimal absenceDays,
        BigDecimal leaveWithoutPayDays,
        int dependentCount,
        List<PayrollManualVariable> manualVariables
) {}
