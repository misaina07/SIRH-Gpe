package com.example.sirh;

import com.example.sirh.dto.PayrollInput;
import com.example.sirh.dto.PayrollManualVariable;
import com.example.sirh.service.PayrollBaseCalculationService;
import com.example.sirh.service.PayrollCalculationService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PayrollBaseCalculationServiceTest {
    private final PayrollBaseCalculationService service = new PayrollBaseCalculationService();
    private final PayrollCalculationService calculationService = new PayrollCalculationService();

    @Test
    void calculatesMonthlyBaseAfterAbsenceDeduction() {
        // Vérifie la première formule du moteur: salaire moins retenue d'absence.
        PayrollInput input = payrollInput("HEBDO_35H");

        var result = service.calculate(input, new BigDecimal("10000"));

        assertEquals(new BigDecimal("240000.00"), result.monthlyBaseAfterAbsence());
        assertEquals(new BigDecimal("10000.00"), result.absenceDeduction());
        assertEquals("ABSENCE", result.lines().get(1).code());
    }

    @Test
    void calculatesStandardHourlyRate() {
        // Vérifie le diviseur horaire standard de 173,33.
        assertEquals(
                new BigDecimal("1442.34"),
                service.calculateHourlyRate(new BigDecimal("250000"), "HEBDO_35H"));
    }

    @Test
    void calculatesAgriculturalHourlyRate() {
        // Vérifie le diviseur horaire agricole configuré à 200.
        assertEquals(
                new BigDecimal("1250.00"),
                service.calculateHourlyRate(new BigDecimal("250000"), "SECTEUR_AGRICOLE"));
    }

    @Test
    void calculatesOvertimeExampleAndGrossSalary() {
        // Cas demandé: 250000 Ar avec 8 heures à +30 % et 4 heures à +50 %.
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

    @Test
    void capsCnapsAtTwoMillionFiveHundredTwentyThousand() {
        // Vérifie que les cotisations CNaPS ne dépassent jamais 2520000 Ar.
        PayrollInput input = payrollInput("HEBDO_35H");
        input = new PayrollInput(
                input.employeeId(), input.matricule(), input.firstName(), input.lastName(),
                new BigDecimal("3000000"), BigDecimal.ZERO, BigDecimal.ZERO,
                input.workRegime(), input.grade(), input.contractStartDate(), input.contractEndDate(),
                input.effectiveWorkedMinutes(), input.overtime25Minutes(), input.overtime50Minutes(),
                input.nightMinutes(), input.sundayMinutes(), input.holidayMinutes(),
                BigDecimal.ZERO, BigDecimal.ZERO, input.dependentCount(),
                input.manualVariables());

        var result = calculationService.calculate(input);

        assertEquals(new BigDecimal("25200.00"), result.cnapsEmployee());
        assertEquals(new BigDecimal("201600.00"), result.cnapsEmployer());
    }

    @Test
    void calculatesStandardSalaryOfThreeHundredThousand() {
        // Cas limite intermédiaire sans heure supplémentaire ni retenue.
        PayrollInput input = new PayrollInput(
                2, "EMP-2026-0002", "Thomas", "Garcia",
                new BigDecimal("300000"), BigDecimal.ZERO, BigDecimal.ZERO,
                "HEBDO_35H", "G4", null, null,
                0, 0, 0, 0, 0, 0,
                BigDecimal.ZERO, BigDecimal.ZERO, 0,
                List.<PayrollManualVariable>of());

        var result = calculationService.calculate(input);

        assertEquals(new BigDecimal("300000.00"), result.grossSalary());
        assertEquals(new BigDecimal("3000.00"), result.irsa());
    }

    @Test
    void appliesMinimumIrsaBelowThreeHundredFiftyThousand() {
        // Vérifie le minimum de perception lorsque le barème donne moins de 3000 Ar.
        PayrollInput input = new PayrollInput(
                4, "EMP-2026-0004", "Lucas", "Bernard",
                new BigDecimal("308700"), BigDecimal.ZERO, BigDecimal.ZERO,
                "HEBDO_35H", "G2", null, null,
                0, 0, 0, 0, 0, 0,
                BigDecimal.ZERO, BigDecimal.ZERO, 0,
                List.<PayrollManualVariable>of());

        var result = calculationService.calculate(input);

        assertTrue(result.taxableIncome().compareTo(new BigDecimal("350000")) < 0);
        assertEquals(new BigDecimal("3000.00"), result.irsa());
    }

    @Test
    void appliesTwentyFivePercentAboveFourMillion() {
        // Vérifie l'application de la tranche IRSA à 25 % après 4 millions.
        PayrollInput input = new PayrollInput(
                6, "EMP-2026-0006", "Hery", "Rafanomezantsoa",
                new BigDecimal("5000000"), BigDecimal.ZERO, BigDecimal.ZERO,
                "HEBDO_35H", "G8", null, null,
                0, 0, 0, 0, 0, 0,
                BigDecimal.ZERO, BigDecimal.ZERO, 0,
                List.<PayrollManualVariable>of());

        var result = calculationService.calculate(input);

        assertTrue(result.taxableIncome().compareTo(new BigDecimal("4000000")) > 0);
        assertTrue(result.irsa().compareTo(new BigDecimal("700000")) > 0);
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
