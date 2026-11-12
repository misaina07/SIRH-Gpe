package com.example.sirh.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateEmployeeContractRequest(
        @NotBlank String contractType, @NotNull LocalDate startDate, LocalDate endDate,
        LocalDate trialPeriodEnd, LocalDate probationRenewalDate, @NotBlank String grade,
        String coefficient, @NotBlank String jobTitle, @NotBlank String workRegime,
        @NotNull @DecimalMin("0.01") BigDecimal monthlyGrossSalary,
        @DecimalMin("0.01") BigDecimal workPercentage, Boolean executive,
        @DecimalMin("0.00") BigDecimal fixedBonus, @DecimalMin("0.00") BigDecimal variableBonus,
        Boolean companyVehicle, Boolean companyHealthPlan, Boolean mealVouchers) { }
