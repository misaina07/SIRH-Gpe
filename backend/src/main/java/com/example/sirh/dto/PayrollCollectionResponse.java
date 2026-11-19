package com.example.sirh.dto;

import java.time.LocalDate;
import java.util.List;

/** Réponse HTTP contenant les données brutes collectées pour chaque salarié. */
public record PayrollCollectionResponse(
        LocalDate from,
        LocalDate to,
        List<PayrollInput> employees
) {}
