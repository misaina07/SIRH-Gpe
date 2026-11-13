package com.example.sirh.controller;

import com.example.sirh.service.PayrollAggregationService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {
    private final PayrollAggregationService service;

    public PayrollController(PayrollAggregationService service) { this.service = service; }

    @GetMapping("/{month}")
    public Object variables(@PathVariable String month, Authentication actor) {
        return service.variables(month, actor);
    }

    @GetMapping(value = "/{month}/export.csv", produces = "text/csv")
    public ResponseEntity<byte[]> export(@PathVariable String month, Authentication actor) {
        String filename = "variables-paie-" + month + ".csv";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(service.csv(month, actor));
    }
}
