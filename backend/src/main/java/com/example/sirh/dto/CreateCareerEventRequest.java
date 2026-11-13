package com.example.sirh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateCareerEventRequest(@NotBlank @Size(max=50) String type,
        @NotNull LocalDate eventDate, @NotBlank @Size(max=180) String title, @Size(max=2000) String description) { }
