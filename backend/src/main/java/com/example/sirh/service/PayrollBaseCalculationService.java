package com.example.sirh.service;

import com.example.sirh.dto.PayrollInput;
import com.example.sirh.dto.PayrollLine;
import com.example.sirh.dto.PayrollBaseResult;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PayrollBaseCalculationService {
    private static final BigDecimal STANDARD_DIVISOR = new BigDecimal("173.33");
    private static final BigDecimal AGRICULTURAL_DIVISOR = new BigDecimal("200");
    private static final int SCALE = 2;

    /**
     * Calcul du salaire de base mensuel après retenue d'absence
     * et du taux horaire selon le diviseur conventionnel.
     */
    public PayrollBaseResult calculate(PayrollInput input, BigDecimal absenceDeduction) {
        if (input == null) throw new IllegalArgumentException("Les données du salarié sont obligatoires.");
        if (input.monthlyBaseSalary() == null)
            throw new IllegalArgumentException("Le salaire de base est obligatoire.");
        if (absenceDeduction == null) absenceDeduction = BigDecimal.ZERO;
        if (absenceDeduction.signum() < 0)
            throw new IllegalArgumentException("La retenue d’absence ne peut pas être négative.");

        BigDecimal base = money(input.monthlyBaseSalary());
        BigDecimal deduction = money(absenceDeduction);
        BigDecimal monthlyBase = money(base.subtract(deduction));
        BigDecimal hourlyRate = calculateHourlyRate(base, input.workRegime());

        // Ligne positive : le salarié conserve son salaire de base.
        PayrollLine baseLine = new PayrollLine(
                "SALAIRE_BASE",
                "Salaire de base du mois",
                "GAIN",
                BigDecimal.ONE.setScale(SCALE),
                base,
                base);

        // Ligne négative : elle représente le montant payé en moins.
        // Les jours d'absence servent de quantité, le taux horaire reste
        // uniquement informatif dans cette première étape.
        PayrollLine absenceLine = new PayrollLine(
                "ABSENCE",
                "Retenue sur absence",
                "RETENUE",
                input.leaveWithoutPayDays() == null ? BigDecimal.ZERO : input.leaveWithoutPayDays(),
                hourlyRate,
                deduction);

        return new PayrollBaseResult(
                base,
                deduction,
                monthlyBase,
                hourlyRate,
                List.of(baseLine, absenceLine));
    }

    public BigDecimal calculateHourlyRate(BigDecimal monthlyBase, String workRegime) {
        if (monthlyBase == null || monthlyBase.signum() < 0)
            throw new IllegalArgumentException("Le salaire de base doit être positif.");
        BigDecimal divisor = AgriculturalOrStandardDivisor(workRegime);
        if (divisor.signum() == 0) throw new IllegalArgumentException("Le diviseur horaire est invalide.");
        return money(monthlyBase.divide(divisor, SCALE + 2, RoundingMode.HALF_UP));
    }

    private BigDecimal AgriculturalOrStandardDivisor(String workRegime) {
        if (workRegime != null && workRegime.toUpperCase().contains("AGRIC"))
            return AGRICULTURAL_DIVISOR;
        return STANDARD_DIVISOR;
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

 
}
