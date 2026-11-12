package com.example.sirh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DirectionApprovalRequest(boolean approved, @Size(max = 30) String positionId, @NotBlank @Size(max = 4000) String comments) { }
