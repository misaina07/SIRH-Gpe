package com.example.sirh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FinanceValidationRequest(boolean approved, @Size(max = 4000) String derogationMotive, @NotBlank @Size(max = 4000) String comments) { }
