package com.example.sirh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RhValidationRequest(
        @NotNull Boolean approved,
        @NotNull Boolean checkFiche,
        @NotNull Boolean checkGrade,
        @NotNull Boolean checkCoherence,
        @NotBlank @Size(max = 4000) String observations
) { }
