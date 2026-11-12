package com.example.sirh.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ConvertCandidateToEmployeeRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 150) String emailPro,
        @Size(max = 50) String phone,
        @NotNull @Past LocalDate birthDate,
        @NotNull LocalDate hireDate,
        @NotBlank @Size(max = 50) String departmentId,
        @NotBlank @Size(max = 20) String managerId,
        @NotBlank @Size(max = 30) String contractType,
        @NotBlank @Size(max = 10) String grade,
        @NotBlank @Size(max = 150) String jobTitle,
        @NotBlank @Size(max = 30) String workRegime,
        @NotNull @DecimalMin("0.01") BigDecimal monthlySalary,
        @DecimalMin("0.01") BigDecimal workPercentage,
        Boolean executive,
        @Size(max = 120) String nationality,
        @Size(max = 80) String nationalId,
        @Size(max = 255) String addressStreet,
        @Size(max = 100) String addressCity,
        @Size(max = 12) String addressZip,
        @Size(max = 150) String emergencyContactName,
        @Size(max = 50) String emergencyContactPhone,
        LocalDate trialPeriodEnd,
        LocalDate contractEndDate
) { }
