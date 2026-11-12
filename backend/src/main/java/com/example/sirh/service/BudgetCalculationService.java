package com.example.sirh.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class BudgetCalculationService {
    private static final BigDecimal MONTHS = BigDecimal.valueOf(12);
    private static final BigDecimal EMPLOYER_RATE = new BigDecimal("1.40");
    private static final BigDecimal TOLERANCE_RATE = new BigDecimal("0.10");

    public BudgetResult calculate(BigDecimal monthlySalaryMax, BigDecimal allocated, BigDecimal consumed) {
        BigDecimal annualCost = monthlySalaryMax.multiply(MONTHS).multiply(EMPLOYER_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal available = allocated.subtract(consumed).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal variance = annualCost.subtract(available).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        String status = variance.signum() == 0 ? "conforme"
                : variance.compareTo(annualCost.multiply(TOLERANCE_RATE)) <= 0 ? "tolerable" : "depassement";
        return new BudgetResult(annualCost, available, variance, status);
    }

    public record BudgetResult(BigDecimal annualCost, BigDecimal availableBudget, BigDecimal variance, String status) { }
}
