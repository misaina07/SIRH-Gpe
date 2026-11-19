package com.example.sirh.controller;

import com.example.sirh.service.PayrollCollectionService;
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

    public PayrollController(PayrollCollectionService service) {
        this.service = service;
    }

    @GetMapping("/periods")
    public List<Map<String, Object>> periods(Authentication actor) {
        return service.periods(actor);
    }

    @PostMapping("/periods")
    public Map<String, Object> openPeriod(@Valid @RequestBody PeriodRequest body, Authentication actor) {
        return service.openPeriod(body.year(), body.month(), actor);
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

    public record PeriodRequest(@NotNull Integer year, @NotNull Integer month) {}

    public record VariableRequest(
            @NotNull Integer employeeId,
            @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period,
            @NotBlank String rubriqueCode,
            @DecimalMin("0") BigDecimal quantite,
            @DecimalMin("0") BigDecimal montant,
            Integer semaine) {}
}
