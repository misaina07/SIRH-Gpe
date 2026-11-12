package com.example.sirh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidateStageRequest(@NotBlank String stage, @Size(max = 2000) String reason) { }
