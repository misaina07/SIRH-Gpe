package com.example.sirh.controller;

import com.example.sirh.service.LeaveManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {
    private final LeaveManagementService service;
    public LeaveController(LeaveManagementService service) { this.service=service; }

    @GetMapping("/types") public Object types(Authentication actor){return service.types(actor);}
    @GetMapping("/me/balances") public Object balances(@RequestParam(required=false) Integer year,Authentication actor){return service.balances(year,actor);}
    @GetMapping("/me/requests") public Object myRequests(Authentication actor){return service.myRequests(actor);}
    @PostMapping("/preview") public Object preview(@Valid @RequestBody LeaveRequestBody body,Authentication actor){return service.preview(body,actor);}
    @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public Object submit(@RequestPart("request") @Valid LeaveRequestBody body,@RequestPart(value="file",required=false) MultipartFile file,Authentication actor){return service.submit(body,file,actor);}
    @PutMapping("/{id}") public Object update(@PathVariable int id,@Valid @RequestBody LeaveRequestBody body,Authentication actor){return service.updateAdjusted(id,body,actor);}
    @DeleteMapping("/{id}") public Object cancel(@PathVariable int id,Authentication actor){return service.cancel(id,actor);}
    @GetMapping("/approvals") public Object approvals(Authentication actor){return service.approvals(actor);}
    @GetMapping("/team-calendar") public Object teamCalendar(@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,Authentication actor){return service.teamCalendar(from,to,actor);}
    @PatchMapping("/{id}/decision") public Object decision(@PathVariable int id,@Valid @RequestBody DecisionBody body,Authentication actor){return service.decide(id,body,actor);}
    @PostMapping("/accrual") public Object accrue(@Valid @RequestBody AccrualBody body,Authentication actor){return service.accrue(body,actor);}
    @GetMapping("/accrual-policies") public Object accrualPolicies(Authentication actor){return service.accrualPolicies(actor);}
    @PutMapping("/accrual-policies") public Object setAccrualPolicy(@Valid @RequestBody AccrualPolicyBody body,Authentication actor){return service.setAccrualPolicy(body,actor);}
    @GetMapping("/calendar") public Object calendar(Authentication actor){return service.calendar(actor);}
    @PutMapping("/calendar") public Object configureCalendar(@Valid @RequestBody CalendarBody body,Authentication actor){return service.configureCalendar(body,actor);}
    @PutMapping("/calendar/holidays") public Object addHoliday(@Valid @RequestBody HolidayBody body,Authentication actor){return service.addHoliday(body,actor);}
    @DeleteMapping("/calendar/holidays") public void removeHoliday(@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date,Authentication actor){service.removeHoliday(date,actor);}
    @GetMapping("/{id}/justification") public ResponseEntity<byte[]> justification(@PathVariable int id,Authentication actor){var f=service.justification(id,actor);return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+f.filename().replace("\"","")+"\"").contentType(MediaType.parseMediaType(f.mimeType())).body(f.content());}

    public record LeaveRequestBody(@NotBlank String leaveTypeId,@NotNull LocalDate startDate,@NotNull LocalDate endDate,
            @NotBlank String startPortion,@NotBlank String endPortion,String reasonDetail) {}
    public record DecisionBody(@NotBlank String decision,String reason) {}
    public record AccrualBody(@NotNull Integer employeeId,@NotBlank String leaveTypeId,@NotNull LocalDate month) {}
    public record AccrualPolicyBody(@NotBlank String leaveTypeId,@NotNull java.math.BigDecimal monthlyDays) {}
    public record CalendarBody(@NotBlank String countingMethod,@NotBlank String regionCode,
            @NotNull java.math.BigDecimal teamAbsenceWarningRatio) {}
    public record HolidayBody(@NotNull LocalDate date,@NotBlank String regionCode,@NotBlank String label) {}
}
