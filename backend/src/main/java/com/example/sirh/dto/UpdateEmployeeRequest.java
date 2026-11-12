package com.example.sirh.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record UpdateEmployeeRequest(
        @Size(max=100) String firstName, @Size(max=100) String lastName,
        @Email @Size(max=150) String emailPro, @Email @Size(max=150) String personalEmail,
        @Size(max=50) String phone, LocalDate birthDate, LocalDate exitDate,
        @Size(max=50) String departmentId, @Size(max=20) String managerId,
        @Size(max=30) String status, @Size(max=120) String nationality,
        @Size(max=80) String nationalId, @Size(max=34) String iban,
        @Size(max=255) String addressStreet, @Size(max=100) String addressCity,
        @Size(max=12) String addressZip, @Size(max=150) String emergencyContactName,
        @Size(max=50) String emergencyContactPhone, @Size(max=150) String officeLocation,
        List<@Size(max=10) String> teleworkDays) { }
