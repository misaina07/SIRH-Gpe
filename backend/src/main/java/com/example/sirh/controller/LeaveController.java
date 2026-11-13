package com.example.sirh.controller;

import com.example.sirh.dto.CreateLeaveRequest;
import com.example.sirh.dto.LeaveDecisionRequest;
import com.example.sirh.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {
    private final LeaveService leaves;

    public LeaveController(LeaveService leaves) {
        this.leaves = leaves;
    }

    @GetMapping("/types")
    public List<Map<String, Object>> types() {
        return leaves.types();
    }

    @GetMapping("/balances")
    public List<Map<String, Object>> balances(
            @RequestParam(defaultValue = "0") int year, Authentication actor) {
        return leaves.balances(actor.getName(), year == 0 ? Year.now().getValue() : year);
    }

    @GetMapping("/requests")
    public List<Map<String, Object>> requests(
            @RequestParam(defaultValue = "false") boolean managerView, Authentication actor) {
        return leaves.requests(actor.getName(), managerView);
    }

    @PostMapping("/requests")
    public Map<String, Object> create(
            @Valid @RequestBody CreateLeaveRequest request, Authentication actor) {
        return leaves.create(actor.getName(), request);
    }

    @PatchMapping("/requests/{id}/decision")
    public Map<String, String> decide(
            @PathVariable int id, @RequestBody LeaveDecisionRequest request, Authentication actor) {
        leaves.decide(actor.getName(), id, request.approved(), request.rejectionReason());
        return Map.of("status", request.approved() ? "approuve" : "refuse");
    }
}
