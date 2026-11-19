package com.example.sirh;

import com.example.sirh.dto.PayrollInput;
import com.example.sirh.dto.PayrollManualVariable;
import com.example.sirh.service.PayrollBaseCalculationService;
import com.example.sirh.service.PayrollCalculationService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PayrollBaseCalculationServiceTest {
    private final PayrollBaseCalculationService service = new PayrollBaseCalculationService();
    private final PayrollCalculationService calculationService = new PayrollCalculationService();

    @Test
    void calculatesMonthlyBaseAfterAbsenceDeduction() {
        PayrollInput input = payrollInput("HEBDO_35H");

        var result = service.calculate(input, new BigDecimal("10000"));

        assertEquals(new BigDecimal("240000.00"), result.monthlyBaseAfterAbsence());
        assertEquals(new BigDecimal("10000.00"), result.absenceDeduction());
        assertEquals("ABSENCE", result.lines().get(1).code());
    }

    @Test
    void calculatesStandardHourlyRate() {
        assertEquals(
                new BigDecimal("1442.34"),
                service.calculateHourlyRate(new BigDecimal("250000"), "HEBDO_35H"));
    }

    @Test
    void calculatesAgriculturalHourlyRate() {
        assertEquals(
                new BigDecimal("1250.00"),
                service.calculateHourlyRate(new BigDecimal("250000"), "SECTEUR_AGRICOLE"));
    }

    @Test
    void calculatesOvertimeExampleAndGrossSalary() {
        PayrollInput input = new PayrollInput(
                1, "EMP-2026-0001", "Jean", "Rakoto",
                new BigDecimal("250000"), BigDecimal.ZERO, BigDecimal.ZERO,
                "HEBDO_35H", "G1", null, null,
                0, 480, 240, 0, 0, 0,
                BigDecimal.ZERO, BigDecimal.ZERO, 0,
                List.<PayrollManualVariable>of());

        var result = calculationService.calculate(input);

        assertEquals(new BigDecimal("273654.38"), result.grossSalary());
        assertEquals(new BigDecimal("23654.38"), result.lines().stream()
                .filter(line -> line.code().startsWith("HS"))
                .map(line -> line.amount())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP));
    }

    private PayrollInput payrollInput(String workRegime) {
        return new PayrollInput(
                1, "EMP-2026-0001", "Jean", "Rakoto",
                new BigDecimal("250000"), BigDecimal.ZERO, BigDecimal.ZERO,
                workRegime, "G1", null, null,
                0, 0, 0, 0, 0, 0,
                BigDecimal.ZERO, new BigDecimal("5"), 0,
                List.<PayrollManualVariable>of());
    }
}
