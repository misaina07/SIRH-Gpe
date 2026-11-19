package com.example.sirh.controller;

import com.example.sirh.service.PayrollCollectionService;
import com.example.sirh.dto.PayrollInput;
import com.example.sirh.dto.PayrollCalculationResult;
import com.example.sirh.service.PayrollCalculationService;
import com.example.sirh.service.EmployeeAccessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {
    private final PayrollCollectionService service;
    private final PayrollCalculationService calculationService;
    private final EmployeeAccessService access;

    public PayrollController(PayrollCollectionService service, PayrollCalculationService calculationService,
                             EmployeeAccessService access) {
        this.service = service;
        this.calculationService = calculationService;
        this.access = access;
    }

    @GetMapping("/periods")
    public List<Map<String, Object>> periods(Authentication actor) {
        // Liste les périodes disponibles pour l'écran de paie.
        return service.periods(actor);
    }

    @PostMapping("/periods")
    public Map<String, Object> openPeriod(@Valid @RequestBody PeriodRequest body, Authentication actor) {
        // Ouvre ou retourne la période correspondant au mois demandé.
        return service.openPeriod(body.year(), body.month(), actor);
    }

    @PatchMapping("/periods/{periodId}/lock")
    public Map<String, Object> lockPeriod(@PathVariable int periodId, Authentication actor) {
        // Route HTTP vers le verrouillage définitif géré dans le service.
        return service.lockPeriod(periodId, actor);
    }

    @GetMapping("/collection")
    public Map<String, Object> collect(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Integer employeeId,
            Authentication actor) {
        return service.collect(from, to, employeeId, actor);
    }

    @GetMapping("/variables")
    public List<Map<String, Object>> variables(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period,
            @RequestParam(required = false) Integer employeeId,
            Authentication actor) {
        return service.variables(period, employeeId, actor);
    }

    @PostMapping("/variables")
    public Map<String, Object> addVariable(@Valid @RequestBody VariableRequest body, Authentication actor) {
        return service.addVariable(body.employeeId(), body.period(), body.rubriqueCode(),
                body.quantite(), body.montant(), body.semaine(), actor);
    }

    @DeleteMapping("/variables/{id}")
    public void deleteVariable(@PathVariable long id, Authentication actor) {
        service.deleteVariable(id, actor);
    }

    @PostMapping("/calculate")
    public PayrollCalculationResult calculate(@Valid @RequestBody PayrollInput input, Authentication actor) {
        // Un calcul de paie est réservé aux RH; les règles restent
        // vérifiées même si un utilisateur appelle directement l'API.
        access.requireHr(actor);
        return calculationService.calculate(input);
    }

    @PostMapping("/periods/{periodId}/bulletins")
    public Map<String, Object> saveBulletin(@PathVariable int periodId,
                                            @Valid @RequestBody PayrollCalculationResult result,
                                            Authentication actor) {
        // Reçoit un résultat déjà calculé et délègue la persistance au service.
        return service.saveBulletin(periodId, result, actor);
    }

    @GetMapping("/bulletins")
    public List<Map<String, Object>> bulletins(
            @RequestParam(required = false) Integer periodId,
            Authentication actor) {
        // Retourne les bulletins selon les droits calculés côté backend.
        return service.bulletins(periodId, actor);
    }

    public record PeriodRequest(@NotNull Integer year, @NotNull Integer month) {}

    public record VariableRequest(
            @NotNull Integer employeeId,
            @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period,
            @NotBlank String rubriqueCode,
            @DecimalMin("0") BigDecimal quantite,
            @DecimalMin("0") BigDecimal montant,
            Integer semaine) {}
}
