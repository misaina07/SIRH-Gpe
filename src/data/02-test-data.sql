-- Jeu de donnees de demonstration compatible avec schema-possible.sql.
-- Les mots de passe restent NULL : l'authentification n'est pas configuree.
BEGIN;

INSERT INTO users (id,name,email,role_type,role_display_name,initials,primary_department,allowed_views,can_validate_rh,can_validate_finance,can_validate_direction,can_create_requisition,can_manage_candidates) VALUES
('usr-1','Claire Delorme','c.delorme@entreprise.fr','RH','Responsable RH & Recrutement','CD','Direction des Ressources Humaines',ARRAY['tableau-de-bord','mes-demandes','nouvelle-demande','recrutement','qualification-rh','onboarding','referentiels-admin'],TRUE,FALSE,FALSE,TRUE,TRUE),
('usr-2','Marc Lefebvre','m.lefebvre@entreprise.fr','Manager','Engineering Manager','ML','Direction des Systèmes d''Information',ARRAY['tableau-de-bord','mes-demandes','nouvelle-demande','recrutement'],FALSE,FALSE,FALSE,TRUE,FALSE),
('usr-3','Gilles Vaudon','g.vaudon@entreprise.fr','Finance','Contrôleur de Gestion DSI','GV','Direction Financière',ARRAY['tableau-de-bord','mes-demandes','validation-finance'],FALSE,TRUE,FALSE,FALSE,FALSE),
('usr-4','Direction Générale','direction@entreprise.fr','Direction','Direction Exécutive & CODIR','DG','Comité de Direction',ARRAY['tableau-de-bord','mes-demandes','approbation-direction'],FALSE,FALSE,TRUE,FALSE,FALSE),
('usr-5','Laurent Fabre','l.fabre@entreprise.fr','Manager','Head of Data & AI Engineering','LF','DSI Data Platform',ARRAY['tableau-de-bord','mes-demandes','nouvelle-demande','recrutement'],FALSE,FALSE,FALSE,TRUE,FALSE);

INSERT INTO departments (id,code,name,short_name,category,primary_manager_id,allocated_budget_annual,consumed_budget_annual,headcount_current,headcount_target) VALUES
('dept-dsi-cloud','DSI-4100','DSI · Infrastructure Cloud & DevOps','Infra Cloud','Technique','usr-2',420000,310000,14,17),
('dept-dsi-cyber','DSI-4120','DSI · Cyber-Sécurité & Conformité NIS2','Cyber-Sécurité','Technique','usr-2',280000,175000,6,9),
('dept-dsi-archi','DSI-4200','DSI · Architecture & Core Platform','Architecture','Technique','usr-2',350000,230000,10,12),
('dept-rh-recrutement','DRH-1200','Direction RH · Recrutement & Talents','RH Recrutement','RH','usr-1',240000,180000,8,10),
('dept-fin-ctrl','DFIN-2100','Contrôle de Gestion & Arbitrage Budgétaire','Contrôle de Gestion','Finance','usr-3',190000,145000,5,6),
('dept-dsi-data','DSI-4300','Direction DSI / Data Platform & IA','Data Platform & IA','Technique','usr-5',310000,220000,7,9);

INSERT INTO manager_departments(manager_id,department_id) VALUES
('usr-2','dept-dsi-cloud'),('usr-2','dept-dsi-cyber'),('usr-2','dept-dsi-archi'),
('usr-1','dept-rh-recrutement'),('usr-3','dept-fin-ctrl'),('usr-5','dept-dsi-data');

INSERT INTO requisitions (id,code,title,department_id,priority,manager_in_charge_id,budget_variance_status,contract_type,location,requester_name,requester_role,creation_date,target_start_date,reason,status,salary_min,salary_max,currency,grade,grade_min,grade_max,department_limit_min,department_limit_max,annual_employer_budget,current_step,rh_check_fiche,rh_check_grade,rh_check_coherence) VALUES
('req-0042','REQ-2026-0042','Ingénieur DevSecOps Senior','dept-dsi-cloud','urgente','usr-2','conforme','CDI — Cadre','Paris (Hybride)','Marc Lefebvre','Engineering Manager','2026-10-15','2026-12-01','Sécuriser la chaîne CI/CD et répondre aux exigences NIS2.','en_cours_finance',3000,3600,'EUR','G5',2800,3800,2800,3800,60480,2,TRUE,TRUE,TRUE),
('req-0048','REQ-2026-0048','Architecte Sécurité des SI','dept-dsi-cyber','normale','usr-2','tolerable','CDI — Cadre supérieur','Paris','Marc Lefebvre','Engineering Manager','2026-10-18','2027-02-01','Renforcer l’architecture sécurité et la conformité NIS2.','en_cours_rh',3400,4100,'EUR','G6',3300,4200,3200,4000,68880,1,FALSE,FALSE,FALSE),
('req-0050','REQ-2026-0050','Tech Lead FullStack TypeScript/React','dept-dsi-archi','normale','usr-2','conforme','CDI — Cadre','Paris / Lyon','Marc Lefebvre','Engineering Manager','2026-10-20','2027-02-15','Soutenir la modernisation des applications internes.','brouillon',3100,3700,'EUR','G5',2800,3800,2800,3800,65520,1,FALSE,FALSE,FALSE);

INSERT INTO available_positions (id,title,department_id,grade,contract_type,status,salary_min,salary_max,salary_range_label,fte,priority,manager_id,location,target_date,requisition_code,description,skills) VALUES
('pos-cloud-1','Ingénieur DevSecOps Senior','dept-dsi-cloud','G5','CDI — Cadre','en_validation',3000,3600,'3 000 € – 3 600 € / mois',1,'urgente','usr-2','Paris (Hybride)','2026-12-01','REQ-2026-0042','Sécurisation CI/CD, Kubernetes et conformité NIS2.',ARRAY['Kubernetes','Terraform','Vault','CI/CD']),
('pos-cloud-2','Ingénieur Cloud SRE Kubernetes','dept-dsi-cloud','G5','CDI — Cadre','ouvert',2900,3400,'2 900 € – 3 400 € / mois',1,'normale','usr-2','Paris (Hybride)','2027-01-15',NULL,'Fiabilité et observabilité des plateformes cloud.',ARRAY['SRE','Grafana','AWS','GCP']),
('pos-cyber-1','Architecte Sécurité des SI','dept-dsi-cyber','G6','CDI — Cadre supérieur','en_validation',3400,4100,'3 400 € – 4 100 € / mois',1,'normale','usr-2','Paris','2027-02-01','REQ-2026-0048','Architecture sécurité et conformité.',ARRAY['NIS2','ISO 27001','Zero Trust','SOC']);

INSERT INTO requisition_approvals(requisition_id,step_name,validator_id,status,comments,validated_at) VALUES
('req-0042','QUALIFICATION_RH','usr-1','approuve','Fiche, grade et cohérence vérifiés.',TIMESTAMP '2026-10-16 14:30:00'),
('req-0042','ARBITRAGE_FINANCE','usr-3','en_attente',NULL,NULL),
('req-0042','APPROBATION_DIRECTION','usr-4','en_attente',NULL,NULL),
('req-0048','QUALIFICATION_RH','usr-1','en_attente','Vérification du grade G6 en cours.',NULL),
('req-0048','ARBITRAGE_FINANCE','usr-3','en_attente',NULL,NULL),
('req-0048','APPROBATION_DIRECTION','usr-4','en_attente',NULL,NULL);

INSERT INTO requisition_audit_events(id,requisition_id,step_name,author_name,author_title,display_date,quote,color) VALUES
('aud-1','req-0042','Création de la demande','Marc Lefebvre','Engineering Manager','15 oct. 2026','Ouverture du besoin DevSecOps.','primary'),
('aud-2','req-0042','Qualification RH','Claire Delorme','Responsable RH','16 oct. 2026','Fiche de poste et grade vérifiés.','emerald'),
('aud-3','req-0042','Arbitrage Finance','Gilles Vaudon','Contrôleur de Gestion','En attente active',NULL,'amber');

INSERT INTO candidates(id,position_id,full_name,initials,role_title,experience_years,score,skills,kanban_stage,received_days_ago,milestone,sla,status_badge,notes,salary_expectation) VALUES
('cand-1','pos-cloud-1','Alexandre Leroy','AL','Ingénieur DevSecOps Senior',7,4.5,ARRAY['Kubernetes','Terraform','CI/CD'],'recue',2,'Nouveau candidat','À traiter','Nouveau','Expérience plateforme cloud.','42 000 €'),
('cand-2','pos-cloud-1','Sarah Rousseau','SR','Ingénieur DevSecOps Senior',6,4.8,ARRAY['Kubernetes','Vault','AWS'],'preselectionne',4,'Préqualification terminée','Dans les délais','Préselectionné','Bonne adéquation technique.','43 000 €'),
('cand-3','pos-cloud-2','Maxime Dubois','MD','Ingénieur Cloud SRE Kubernetes',5,4.1,ARRAY['SRE','Grafana','GCP'],'entretien',6,'Entretien technique','À planifier','Entretien','Disponibilités à confirmer.','38 000 €');

INSERT INTO onboarding_people(id,full_name,initials,department_name,role_title,days_remaining,arrival_date,tasks_done,tasks_total,color_scheme) VALUES
('onb-1','Élodie Martin','EM','Infra Cloud','Ingénieure Cloud',12,'2026-11-24',4,8,'blue'),
('onb-2','Thomas Bernard','TB','RH Recrutement','Chargé de recrutement',5,'2026-11-17',6,8,'emerald');

COMMIT;
