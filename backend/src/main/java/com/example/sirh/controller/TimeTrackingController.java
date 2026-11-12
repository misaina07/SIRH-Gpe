package com.example.sirh.controller;

import com.example.sirh.service.TimeTrackingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/time-tracking")
public class TimeTrackingController {
    private final TimeTrackingService service;
    public TimeTrackingController(TimeTrackingService service) { this.service = service; }

    @GetMapping("/me/today") public Map<String,Object> today(Authentication actor) { return service.today(actor); }
    @PostMapping("/me/events") public Map<String,Object> event(@Valid @RequestBody EventRequest body, Authentication actor) {
        return service.record(body.eventType(), body.idempotencyKey(), actor);
    }
    @GetMapping("/sheets") public Object sheets(@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required=false) Integer employeeId, Authentication actor) {
        return service.sheets(from,to,employeeId,actor);
    }
    @GetMapping("/schedules/{employeeId}") public Object schedule(@PathVariable int employeeId, Authentication actor) { return service.schedule(employeeId,actor); }
    @PutMapping("/schedules/{employeeId}") public Object setSchedule(@PathVariable int employeeId,@Valid @RequestBody ScheduleRequest body,Authentication actor) {
        return service.setSchedule(employeeId,body,actor);
    }
    @PostMapping("/regularizations") public Object regularize(@Valid @RequestBody RegularizationRequest body,Authentication actor) { return service.requestRegularization(body,actor); }
    @GetMapping("/regularizations") public Object regularizations(Authentication actor) { return service.regularizations(actor); }
    @PatchMapping("/regularizations/{id}") public Object review(@PathVariable long id,@Valid @RequestBody ReviewRequest body,Authentication actor) { return service.review(id,body,actor); }
    @GetMapping("/me/overtime-preference") public Object preference(@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate weekStart,Authentication actor) { return service.preference(weekStart,actor); }
    @PutMapping("/me/overtime-preference") public Object setPreference(@Valid @RequestBody PreferenceRequest body,Authentication actor) { return service.setPreference(body,actor); }

    public record EventRequest(@NotBlank String eventType,@NotNull UUID idempotencyKey) {}
    public record ScheduleDay(@NotNull Integer isoWeekday,@NotNull LocalTime startTime,@NotNull LocalTime endTime,Boolean remote,Boolean onCall) {}
    public record ScheduleRequest(@NotNull java.util.List<@Valid ScheduleDay> days) {}
    public record RegularizationRequest(@NotBlank String eventType,@NotNull java.time.OffsetDateTime requestedAt,@NotBlank String reason) {}
    public record ReviewRequest(@NotNull Boolean approved,String note) {}
    public record PreferenceRequest(@NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate weekStart,@NotBlank String preference) {}
}
