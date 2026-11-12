package com.example.sirh;

import com.example.sirh.service.BudgetCalculationService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BudgetCalculationServiceTest {
    private final BudgetCalculationService service = new BudgetCalculationService();

    @Test
    void calculatesEmployerCostWithConfirmedFortyPercentRate() {
        var result = service.calculate(new BigDecimal("3600"), new BigDecimal("100000"), new BigDecimal("40000"));
        assertEquals(new BigDecimal("60480.00"), result.annualCost());
        assertEquals(new BigDecimal("60000.00"), result.availableBudget());
        assertEquals("tolerable", result.status());
    }

    @Test
    void marksVarianceWithinTenPercentAsTolerable() {
        var result = service.calculate(new BigDecimal("3600"), new BigDecimal("60480"), new BigDecimal("0"));
        assertEquals(new BigDecimal("0.00"), result.variance());
        assertEquals("conforme", result.status());
    }

    @Test
    void marksVarianceOverTenPercentAsOverrun() {
        var result = service.calculate(new BigDecimal("3600"), new BigDecimal("50000"), new BigDecimal("0"));
        assertEquals(new BigDecimal("10480.00"), result.variance());
        assertEquals("depassement", result.status());
    }
}
