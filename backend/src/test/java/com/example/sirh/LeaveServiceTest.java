package com.example.sirh;

import com.example.sirh.service.LeaveService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LeaveServiceTest {
    @Test
    void countsOnlyWeekdays() {
        assertEquals(5, LeaveService.businessDays(
                LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 13)));
        assertEquals(0, LeaveService.businessDays(
                LocalDate.of(2026, 11, 14), LocalDate.of(2026, 11, 15)));
    }
}
