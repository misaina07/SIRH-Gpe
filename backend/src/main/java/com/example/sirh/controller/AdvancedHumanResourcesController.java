package com.example.sirh.controller;

import com.example.sirh.service.AdvancedHumanResourcesService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AdvancedHumanResourcesController {
    private final AdvancedHumanResourcesService service;

    public AdvancedHumanResourcesController(AdvancedHumanResourcesService service) {
        this.service = service;
    }

    @GetMapping("/evaluations")
    public List<Map<String, Object>> evaluations() {
        return service.evaluations();
    }

    @PostMapping("/evaluations")
    public Map<String, Object> createEvaluation(@RequestBody Map<String, Object> body) {
        return service.createEvaluation(body);
    }

    @GetMapping("/career")
    public List<Map<String, Object>> career(@RequestParam(required = false) Integer employeeId) {
        return service.career(employeeId);
    }

    @PostMapping("/career/events")
    public Map<String, Object> createCareerEvent(@RequestBody Map<String, Object> body) {
        return service.createCareerEvent(body);
    }

    @GetMapping("/discipline/incidents")
    public List<Map<String, Object>> incidents() {
        return service.incidents();
    }

    @PostMapping("/discipline/incidents")
    public Map<String, Object> createIncident(@RequestBody Map<String, Object> body) {
        return service.createIncident(body);
    }

    @GetMapping("/offboarding")
    public List<Map<String, Object>> offboarding() {
        return service.offboarding();
    }

    @PostMapping("/offboarding")
    public Map<String, Object> createOffboarding(@RequestBody Map<String, Object> body) {
        return service.createOffboarding(body);
    }
}
