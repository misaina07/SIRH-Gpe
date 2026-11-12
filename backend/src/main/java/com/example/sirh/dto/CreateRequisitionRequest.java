package com.example.sirh.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRequisitionRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String departmentId,
        @NotBlank @Pattern(regexp = "urgente|normale|basse") String priority,
        @NotBlank @Size(max = 150) String contractType,
        @NotBlank @Size(max = 150) String location,
        @NotNull LocalDate targetStartDate,
        @NotBlank String reason,
        @NotNull @DecimalMin("0.01") BigDecimal salaryMin,
        @NotNull @DecimalMin("0.01") BigDecimal salaryMax,
        @NotBlank @Size(max = 30) String grade,
        @Size(max = 4000) String derogationMotive,
        Boolean submit
) { }
