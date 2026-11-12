package com.testApi.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table (name="formations")
public class Formation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-incrément
    private Integer id;
    
    private String titre;
    private String description;
    private String niveau;

    // 1. Constructeur par défaut (OBLIGATOIRE pour JPA)
    public Formation() {
    }

    // 2. Constructeur complet
    public Formation(Integer id, String titre, String description, String niveau) {
        this.id = id;
        this.titre = titre;
        this.description = description;
        this.niveau = niveau;
    }

    // Constructeur pratique sans ID (utile pour la création en BDD)
    public Formation(String titre, String description, String niveau) {
        this.titre = titre;
        this.description = description;
        this.niveau = niveau;
    }

    // Getters et Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getNiveau() {
        return niveau;
    }

    public void setNiveau(String niveau) {
        this.niveau = niveau;
    }
}