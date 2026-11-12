package com.example.sirh.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record EmployeePersonalChangeRequest(
        @Email @Size(max=150) String personalEmail,
        @Size(max=50) String phone,
        @Size(max=255) String addressStreet,
        @Size(max=100) String addressCity,
        @Size(max=12) String addressZip,
        @Size(max=150) String emergencyContactName,
        @Size(max=50) String emergencyContactPhone,
        @Size(max=34) String iban) { }
