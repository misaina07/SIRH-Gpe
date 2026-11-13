package com.example.sirh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateLeaveRequest(
        @NotBlank String leaveTypeId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        String justificationFileUrl
) {}
