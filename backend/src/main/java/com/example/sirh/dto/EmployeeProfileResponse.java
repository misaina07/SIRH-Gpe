package com.example.sirh.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record EmployeeProfileResponse(
        Integer id, String matricule, String firstName, String lastName, String emailPro, String phone,
        LocalDate birthDate, LocalDate hireDate, String departmentId, String departmentName,
        String managerId, String managerName, String contractType, String grade, String jobTitle,
        String workRegime, BigDecimal workPercentage, BigDecimal monthlySalary, String status,
        String nationality, String nationalId, String addressStreet, String addressCity, String addressZip,
        String emergencyContactName, String emergencyContactPhone, LocalDate trialPeriodEnd,
        LocalDate contractEndDate, String personalEmail, String officeLocation, List<String> teleworkDays,
        LocalDate exitDate, boolean anonymized, String coefficient, BigDecimal fixedBonus, BigDecimal variableBonus,
        Boolean companyVehicle, Boolean companyHealthPlan, Boolean mealVouchers, String ibanMasked,List<String> skills
        ,Boolean executive
) { }
