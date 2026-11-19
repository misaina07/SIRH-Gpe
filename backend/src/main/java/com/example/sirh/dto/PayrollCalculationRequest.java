package com.example.sirh.dto;

import java.time.LocalDate;

/** Période pour laquelle la paie d'un salarié ou de plusieurs salariés doit être calculée. */
public record PayrollCalculationRequest(
        Integer employeeId,
        LocalDate from,
        LocalDate to
) {}
