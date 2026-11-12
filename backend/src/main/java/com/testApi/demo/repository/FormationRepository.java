package com.testApi.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.testApi.demo.model.Formation;

@Repository 
public interface FormationRepository extends JpaRepository<Formation , Integer>{

}
