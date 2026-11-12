package com.example.sirh.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RetentionPolicyRequest(@NotBlank String dataCategory, @Min(1) @Max(36500) int retentionDays) { }
