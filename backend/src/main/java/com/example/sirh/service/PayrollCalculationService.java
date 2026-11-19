package com.example.sirh.service;

import com.example.sirh.dto.PayrollInput;
import com.example.sirh.dto.PayrollLine;
import com.example.sirh.dto.PayrollCalculationResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class PayrollCalculationService {
    private static final int SCALE = 2;
    private static final BigDecimal HOURS_STANDARD = new BigDecimal("173.33");
    private static final BigDecimal HOURS_AGRICULTURAL = new BigDecimal("200");
    private static final BigDecimal CNAPS_LIMIT = new BigDecimal("2520000");
    private static final BigDecimal CNAPS_EMPLOYEE = new BigDecimal("0.01");
    private static final BigDecimal CNAPS_EMPLOYER = new BigDecimal("0.08");
    private static final BigDecimal OSTIE_EMPLOYEE = new BigDecimal("0.01");
    private static final BigDecimal OSTIE_EMPLOYER = new BigDecimal("0.05");
    private static final BigDecimal IRSA_MINIMUM = new BigDecimal("3000");
    private static final BigDecimal IRSA_DEPENDENT_REDUCTION = new BigDecimal("2000");

    /**
     * Calcule tous les gains, retenues, cotisations, l'IRSA et le coût employeur
     * d'un bulletin à partir des données déjà validées côté serveur.
     */
    public PayrollCalculationResult calculate(PayrollInput input) {
        if (input == null) throw new IllegalArgumentException("Les données de paie sont obligatoires.");
        if (input.monthlyBaseSalary() == null)
            throw new IllegalArgumentException("Le salaire de base est obligatoire.");

        List<String> warnings = new ArrayList<>();
        List<PayrollLine> lines = new ArrayList<>();
        BigDecimal monthlyBase = money(input.monthlyBaseSalary());
        BigDecimal divisor = isAgricultural(input.workRegime()) ? HOURS_AGRICULTURAL : HOURS_STANDARD;
        BigDecimal hourlyRate = money(monthlyBase.divide(divisor, SCALE + 2, RoundingMode.HALF_UP));

        // Retenue d'absence : une journée représente 7 heures en standard,
        // ou 8 heures en agricole.
        BigDecimal hoursPerDay = isAgricultural(input.workRegime())
                ? new BigDecimal("8") : new BigDecimal("7");
        BigDecimal absenceDays = input.leaveWithoutPayDays() == null
                ? BigDecimal.ZERO : input.leaveWithoutPayDays();
        BigDecimal absenceDeduction = money(hourlyRate.multiply(hoursPerDay).multiply(absenceDays));

        BigDecimal baseAfterAbsence = money(monthlyBase.subtract(absenceDeduction));
        lines.add(line("SALAIRE_BASE", "Salaire de base du mois", "GAIN",
                BigDecimal.ONE, monthlyBase, baseAfterAbsence));
        if (absenceDeduction.signum() > 0)
            lines.add(line("ABSENCE", "Retenue sur absence", "RETENUE",
                    absenceDays, hourlyRate.multiply(hoursPerDay), absenceDeduction));

        // Heures supplémentaires déjà ventilées par la feuille de temps.
        // Tranche 1 : les 8 premières heures supplémentaires sont majorées à +30 %.
        BigDecimal overtime25 = money(hoursFromMinutes(input.overtime25Minutes()).multiply(hourlyRate).multiply(new BigDecimal("1.30")));
        BigDecimal overtime50 = money(hoursFromMinutes(input.overtime50Minutes()).multiply(hourlyRate).multiply(new BigDecimal("1.50")));
        if (overtime25.signum() > 0)
            lines.add(line("HS_25", "Première tranche d'heures supplémentaires (+30 %)", "GAIN",
                    hoursFromMinutes(input.overtime25Minutes()), hourlyRate.multiply(new BigDecimal("1.30")), overtime25));
        if (overtime50.signum() > 0)
            lines.add(line("HS_50", "Heures supplémentaires à 50 %", "GAIN",
                    hoursFromMinutes(input.overtime50Minutes()), hourlyRate.multiply(new BigDecimal("1.50")), overtime50));

        // Plafond mensuel de 20 heures supplémentaires par semaine.
        // Les feuilles mensuelles ne permettent pas une ventilation complète
        // exacte par semaine : cette alerte est visible pour la RH.
        BigDecimal weeklyHours = hoursFromMinutes(input.overtime25Minutes() + input.overtime50Minutes()).divide(BigDecimal.valueOf(4), SCALE, RoundingMode.HALF_UP);
        if (weeklyHours.compareTo(new BigDecimal("20")) > 0)
            warnings.add("Plafond indicatif de 20 h supplémentaires dépassé sur une moyenne hebdomadaire.");

        // Majorations paramétrables.
        BigDecimal night = money(hoursFromMinutes(input.nightMinutes()).multiply(hourlyRate).multiply(new BigDecimal("1.50")));
        BigDecimal sunday = money(hoursFromMinutes(input.sundayMinutes()).multiply(hourlyRate).multiply(new BigDecimal("1.40")));
        BigDecimal holiday = money(hoursFromMinutes(input.holidayMinutes()).multiply(hourlyRate).multiply(new BigDecimal("2.00")));
        if (night.signum() > 0) lines.add(line("NUIT", "Majoration travail de nuit", "GAIN",
                hoursFromMinutes(input.nightMinutes()), hourlyRate.multiply(new BigDecimal("1.50")), night));
        if (sunday.signum() > 0) lines.add(line("DIMANCHE", "Majoration du dimanche", "GAIN",
                hoursFromMinutes(input.sundayMinutes()), hourlyRate.multiply(new BigDecimal("1.40")), sunday));
        if (holiday.signum() > 0) lines.add(line("FERIE", "Majoration jour férié", "GAIN",
                hoursFromMinutes(input.holidayMinutes()), hourlyRate.multiply(new BigDecimal("2.00")), holiday));

        // Saisies manuelles : gains ou retenues.
        BigDecimal manualGains = BigDecimal.ZERO;
        BigDecimal manualDeductions = BigDecimal.ZERO;
        if (input.manualVariables() != null) {
            for (var variable : input.manualVariables()) {
                BigDecimal amount = variable.amount() == null ? BigDecimal.ZERO : money(variable.amount());
                if (amount.signum() == 0) continue;
                if ("RETENUE".equalsIgnoreCase(variable.type())) {
                    manualDeductions = manualDeductions.add(amount);
                } else {
                    manualGains = manualGains.add(amount);
                }
                lines.add(line(variable.rubriqueCode(), variable.label(), variable.type(),
                        variable.quantity() == null ? BigDecimal.ONE : variable.quantity(),
                        amount, amount));
            }
        }

        BigDecimal gross = money(baseAfterAbsence
                .add(overtime25).add(overtime50).add(night).add(sunday).add(holiday)
                .add(manualGains).subtract(manualDeductions));

        BigDecimal cnapsBase = gross.min(CNAPS_LIMIT);
        BigDecimal cnapsEmployee = money(cnapsBase.multiply(CNAPS_EMPLOYEE));
        BigDecimal cnapsEmployer = money(cnapsBase.multiply(CNAPS_EMPLOYER));
        BigDecimal ostieEmployee = money(gross.multiply(OSTIE_EMPLOYEE));
        BigDecimal ostieEmployer = money(gross.multiply(OSTIE_EMPLOYER));
        BigDecimal taxable = money(gross.subtract(cnapsEmployee).subtract(ostieEmployee));
        BigDecimal irsa = calculateIrsa(taxable, input.dependentCount());

        lines.add(line("CNAPS_SALARIE", "CNaPS salarié", "RETENUE", CNAPS_EMPLOYEE, cnapsBase, cnapsEmployee));
        lines.add(line("CNAPS_EMPLOYEUR", "CNaPS employeur", "EMPLOYEUR", CNAPS_EMPLOYER, cnapsBase, cnapsEmployer));
        lines.add(line("OSTIE_SALARIE", "OSTIE salarié", "RETENUE", OSTIE_EMPLOYEE, gross, ostieEmployee));
        lines.add(line("OSTIE_EMPLOYEUR", "OSTIE employeur", "EMPLOYEUR", OSTIE_EMPLOYER, gross, ostieEmployer));
        lines.add(line("IRSA", "Impôt retenu à la source", "RETENUE", BigDecimal.ZERO, taxable, irsa));

        BigDecimal totalDeductions = money(cnapsEmployee.add(ostieEmployee).add(irsa).add(manualDeductions));
        BigDecimal net = money(gross.subtract(totalDeductions));
        BigDecimal employerCost = money(gross.add(cnapsEmployer).add(ostieEmployer));

        return new PayrollCalculationResult(
                input.employeeId(), input.matricule(), input.firstName(), input.lastName(),
                monthlyBase, absenceDeduction, gross, cnapsEmployee, cnapsEmployer,
                ostieEmployee, ostieEmployer, taxable, irsa, totalDeductions, net,
                employerCost, warnings, lines);
    }

    private BigDecimal calculateIrsa(BigDecimal taxable, int dependentCount) {
        BigDecimal tax = BigDecimal.ZERO;
        tax = tax.add(progressive(taxable, new BigDecimal("350000"), new BigDecimal("0")));
        tax = tax.add(progressiveFromTo(taxable, new BigDecimal("350000"), new BigDecimal("400000"), new BigDecimal("0.05")));
        tax = tax.add(progressiveFromTo(taxable, new BigDecimal("400000"), new BigDecimal("500000"), new BigDecimal("0.10")));
        tax = tax.add(progressiveFromTo(taxable, new BigDecimal("500000"), new BigDecimal("600000"), new BigDecimal("0.15")));
        tax = tax.add(progressiveFromTo(taxable, new BigDecimal("600000"), new BigDecimal("4000000"), new BigDecimal("0.20")));
        tax = tax.add(taxable.subtract(new BigDecimal("4000000")).max(BigDecimal.ZERO).multiply(new BigDecimal("0.25")));
        tax = tax.subtract(IRSA_DEPENDENT_REDUCTION.multiply(BigDecimal.valueOf(Math.max(dependentCount, 0))));
        if (tax.signum() < 0) tax = BigDecimal.ZERO;
        if (tax.compareTo(IRSA_MINIMUM) < 0) tax = IRSA_MINIMUM;
        return money(tax);
    }

    private BigDecimal progressive(BigDecimal taxable, BigDecimal limit, BigDecimal rate) {
        return taxable.min(limit).multiply(rate);
    }

    private BigDecimal progressiveFromTo(BigDecimal taxable, BigDecimal low, BigDecimal high, BigDecimal rate) {
        if (taxable.compareTo(low) <= 0) return BigDecimal.ZERO;
        BigDecimal portion = taxable.min(high).subtract(low).max(BigDecimal.ZERO);
        return portion.multiply(rate);
    }

    private BigDecimal hoursFromMinutes(int minutes) {
        return new BigDecimal(minutes).divide(new BigDecimal("60"), 4, RoundingMode.HALF_UP);
    }

    private boolean isAgricultural(String workRegime) {
        return workRegime != null && workRegime.toUpperCase().contains("AGR");
    }

    private PayrollLine line(String code, String label, String type,
                             BigDecimal quantity, BigDecimal rate, BigDecimal amount) {
        return new PayrollLine(code, label, type, money(quantity),
                money(rate), money(amount));
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }
}
