package com.testApi.demo.service;

import java.util.List;
import org.springframework.stereotype.Service;
import com.testApi.demo.model.Formation;
import com.testApi.demo.repository.FormationRepository;

@Service 
public class FormationService {
     
    private final FormationRepository formationRepository;

    public FormationService(FormationRepository formationRepository) {
        this.formationRepository = formationRepository;
    }

    public List<Formation> getListeFormation(){
        return formationRepository.findAll();
    }
     
}
