package com.testApi.demo.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.testApi.demo.model.Formation;
import com.testApi.demo.service.FormationService;

@RestController
@RequestMapping("/api")
// @CrossOrigin(origins = "*")
public class FormationController {
    private final FormationService formationService;

    public FormationController(FormationService formationService) {
        this.formationService = formationService;
    }

    @GetMapping("/formations")
    public ResponseEntity<List<Formation>> listeFormation() {
        List<Formation> liste = formationService.getListeFormation();

        if(!liste.isEmpty()){
            return ResponseEntity.ok(liste);
        } else {
            return ResponseEntity.noContent().build();
        }
       
    }

}
