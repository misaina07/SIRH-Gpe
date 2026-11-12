-- =========================================================
-- JEU DE DONNEES DE TEST SIRH
-- A executer APRES la creation des tables de schema.sql
-- Base cible : sirh
-- Les identifiants sont fixes pour faciliter les tests.
-- =========================================================

BEGIN;

-- 1) UTILISATEURS
INSERT INTO users
(id, name, initials, email, role_type, role_display_name, primary_department,
 password_hash, can_validate_rh, can_validate_finance,
 can_validate_direction, can_create_requisition, can_manage_candidates)
VALUES
(1, 'Claire Delorme', 'CD', 'c.delorme@entreprise.fr', 'RH',
 'Responsable RH & Recrutement', 'Direction des Ressources Humaines',
 '$2a$10$EXEMPLE_HASH_A_REMPLACER', TRUE, FALSE, FALSE, TRUE, TRUE),
(2, 'Marc Lefebvre', 'ML', 'm.lefebvre@entreprise.fr', 'Manager',
 'Engineering Manager', 'Direction des Systèmes d''Information',
 '$2a$10$EXEMPLE_HASH_A_REMPLACER', FALSE, FALSE, FALSE, TRUE, FALSE),
(3, 'Gilles Vaudon', 'GV', 'g.vaudon@entreprise.fr', 'Finance',
 'Contrôleur de Gestion DSI', 'Direction Financière',
 '$2a$10$EXEMPLE_HASH_A_REMPLACER', FALSE, TRUE, FALSE, FALSE, FALSE),
(4, 'Direction Générale', 'DG', 'direction@entreprise.fr', 'Direction',
 'Direction Exécutive & CODIR', 'Comité de Direction',
 '$2a$10$EXEMPLE_HASH_A_REMPLACER', FALSE, FALSE, TRUE, FALSE, FALSE),
(5, 'Laurent Fabre', 'LF', 'l.fabre@entreprise.fr', 'Manager',
 'Head of Data & AI Engineering', 'DSI · Data Platform & IA',
 '$2a$10$EXEMPLE_HASH_A_REMPLACER', FALSE, FALSE, FALSE, TRUE, FALSE);

-- 2) DEPARTEMENTS
INSERT INTO departments
(id, code, name, short_name, category, primary_manager_id,
 allocated_budget_annual, consumed_budget_annual, headcount_current, headcount_target)
VALUES
('dept-dsi-cloud', 'DSI-4100', 'DSI · Infrastructure Cloud & DevOps',
 'Infra Cloud', 'Technique', 2, 420000, 310000, 14, 17),
('dept-dsi-cyber', 'DSI-4120', 'DSI · Cyber-Sécurité & Conformité NIS2',
 'Cyber-Sécurité', 'Technique', 2, 280000, 175000, 6, 9),
('dept-dsi-archi', 'DSI-4200', 'DSI · Architecture Logicielle & Core Platform',
 'Archi & Core Platform', 'Technique', 2, 350000, 230000, 10, 12),
('dept-rh-recrutement', 'DRH-1200', 'Direction RH · Recrutement & Talents',
 'RH Recrutement', 'RH', 1, 240000, 180000, 8, 10),
('dept-fin-ctrl', 'DFIN-2100', 'Contrôle de Gestion & Arbitrage Budgétaire',
 'Contrôle de Gestion', 'Finance', 3, 190000, 145000, 5, 6),
('dept-dsi-data', 'DSI-4300', 'Direction DSI / Data Platform & IA',
 'Data Platform & IA', 'Technique', 5, 310000, 220000, 7, 9);

-- 3) RESPONSABILITES MULTI-DEPARTEMENTS
INSERT INTO manager_departments (id, manager_id, department_id) VALUES
(1, 2, 'dept-dsi-cloud'),
(2, 2, 'dept-dsi-cyber'),
(3, 2, 'dept-dsi-archi'),
(4, 1, 'dept-rh-recrutement'),
(5, 3, 'dept-fin-ctrl'),
(6, 5, 'dept-dsi-data');

-- 4) POSTES OUVERTS / REQUISITIONS
INSERT INTO available_positions
(id, code_req, title, department_id, grade, contract_type, status,
 salary_min, salary_max, salary_range_label, fte, manager_id,
 location, target_date, skills)
VALUES
(1, 'REQ-2026-0042', 'Ingénieur DevSecOps Senior', 'dept-dsi-cloud',
 'G5', 'CDI — Cadre', 'en_validation', 3000, 3600,
 '3 000 € – 3 600 € / mois', 1.00, 2, 'Paris (Hybride)', '2026-12-01',
 ARRAY['Kubernetes','Terraform','Vault','CI/CD']),
(2, 'REQ-2026-0044', 'Ingénieur Cloud SRE Kubernetes', 'dept-dsi-cloud',
 'G5', 'CDI — Cadre', 'ouvert', 2900, 3400,
 '2 900 € – 3 400 € / mois', 1.00, 2, 'Paris (Hybride)', '2027-01-15',
 ARRAY['SRE','Grafana','AWS','GCP']),
(3, 'REQ-2026-0048', 'Architecte Sécurité des SI', 'dept-dsi-cyber',
 'G6', 'CDI — Cadre supérieur', 'en_validation', 3400, 4100,
 '3 400 € – 4 100 € / mois', 1.00, 2, 'Paris', '2027-02-01',
 ARRAY['NIS2','ISO 27001','Zero Trust','SOC']),
(4, 'REQ-2026-0050', 'Tech Lead FullStack TypeScript/React', 'dept-dsi-archi',
 'G5', 'CDI — Cadre', 'brouillon', 3100, 3700,
 '3 100 € – 3 700 € / mois', 1.00, 2, 'Paris / Lyon', '2027-02-15',
 ARRAY['React','TypeScript','Node.js','GraphQL']),
(5, 'REQ-2026-0045', 'Chef de Projet RH & SIRH', 'dept-rh-recrutement',
 'G4', 'CDI — Cadre', 'en_validation', 2800, 3300,
 '2 800 € – 3 300 € / mois', 1.00, 1, 'Lyon', '2027-01-01',
 ARRAY['SIRH','Gestion de projet','Droit social']),
(6, 'REQ-2026-0046', 'Contrôleur de Gestion Opérationnel DSI', 'dept-fin-ctrl',
 'G5', 'CDI — Cadre', 'en_validation', 3000, 3500,
 '3 000 € – 3 500 € / mois', 1.00, 3, 'Paris', '2027-01-01',
 ARRAY['Power BI','SAP FI-CO','Modélisation financière']),
(7, 'REQ-2026-0049', 'Data Scientist IA Générative & LLM', 'dept-dsi-data',
 'G6', 'CDI — Cadre', 'en_validation', 3400, 4000,
 '3 400 € – 4 000 € / mois', 1.00, 5, 'Paris (Hybride)', '2027-02-01',
 ARRAY['PyTorch','LangChain','RAG','Python']);

-- 5) VISAS / APPROBATIONS : une ligne par etape du circuit
INSERT INTO position_approvals
(id, position_id, step_name, validator_id, status, comments, validated_at)
VALUES
(1, 1, 'QUALIFICATION_RH', 1, 'approuve',
 'Fiche de poste et grade G5 vérifiés.', '2026-10-16 14:30:00'),
(2, 1, 'ARBITRAGE_FINANCE', 3, 'en_attente', NULL, NULL),
(3, 1, 'APPROBATION_DIRECTION', 4, 'en_attente', NULL, NULL),
(4, 3, 'QUALIFICATION_RH', 1, 'en_attente', 'Vérification du grade G6 en cours.', NULL),
(5, 3, 'ARBITRAGE_FINANCE', 3, 'en_attente', NULL, NULL),
(6, 3, 'APPROBATION_DIRECTION', 4, 'en_attente', NULL, NULL),
(7, 5, 'QUALIFICATION_RH', 1, 'en_attente', 'Contrôle de cohérence du besoin.', NULL),
(8, 5, 'ARBITRAGE_FINANCE', 3, 'en_attente', NULL, NULL),
(9, 5, 'APPROBATION_DIRECTION', 4, 'en_attente', NULL, NULL);

-- 6) CANDIDATS (stages autorises par le CHECK du schema : recu, ...)
INSERT INTO candidates
(id, position_id, first_name, last_name, email, phone, kanban_stage,
 salary_expectations, rejection_reason, applied_at)
VALUES
(1, 1, 'Alexandre', 'Leroy', 'alexandre.leroy@example.fr', '+33 6 10 20 30 40',
 'recu', '42 000 €', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 1, 'Maxime', 'Dubois', 'maxime.dubois@example.fr', '+33 6 11 22 33 44',
 'recu', '38 000 €', NULL, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, 1, 'Sarah', 'Rousseau', 'sarah.rousseau@example.fr', '+33 6 12 23 34 45',
 'preselectionne', '43 000 €', NULL, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(4, 1, 'Karim', 'Haddad', 'karim.haddad@example.fr', '+33 6 13 24 35 46',
 'preselectionne', '41 000 €', NULL, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(5, 1, 'Julien', 'Vasseur', 'julien.vasseur@example.fr', '+33 6 14 25 36 47',
 'entretien', '43 200 €', NULL, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(6, 3, 'Elena', 'Kova', 'elena.kova@example.fr', '+33 6 15 26 37 48',
 'retenu', '44 000 €', NULL, CURRENT_TIMESTAMP - INTERVAL '14 days'),
(7, 2, 'Thomas', 'Colin', 'thomas.colin@example.fr', '+33 6 16 27 38 49',
 'refuse', '32 000 €', 'Expérience insuffisante pour le niveau senior.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(8, 3, 'Benoît', 'Mercier', 'benoit.mercier@example.fr', '+33 6 17 28 39 50',
 'refuse', '55 000 €', 'Prétentions salariales hors barème.', CURRENT_TIMESTAMP - INTERVAL '12 days');

-- 7) REFERENTIEL SALARIES
INSERT INTO employees
(id, matricule, user_id, first_name, last_name, email_pro, phone,
 birth_date, hire_date, department_id, manager_id, contract_type,
 monthly_salary, status)
VALUES
(1, 'EMP-2026-0001', NULL, 'Élodie', 'Martin', 'elodie.martin@entreprise.fr',
 '+33 6 20 30 40 50', '1992-04-12', '2021-06-01', 'dept-dsi-cloud', 2,
 'CDI', 4200, 'actif'),
(2, 'EMP-2026-0002', NULL, 'Thomas', 'Garcia', 'thomas.garcia@entreprise.fr',
 '+33 6 21 31 41 51', '1995-09-23', '2026-11-03', 'dept-dsi-archi', 2,
 'CDI', 3500, 'actif'),
(3, 'EMP-2026-0003', NULL, 'Amélie', 'Morin', 'amelie.morin@entreprise.fr',
 '+33 6 22 32 42 52', '1989-02-08', '2026-11-10', 'dept-fin-ctrl', 3,
 'CDI', 3900, 'actif'),
(4, 'EMP-2026-0004', NULL, 'Lucas', 'Bernard', 'lucas.bernard@entreprise.fr',
 '+33 6 23 33 43 53', '1998-07-19', '2026-11-16', 'dept-rh-recrutement', 1,
 'CDD', 2800, 'actif');

-- 8) DOCUMENTS ADMINISTRATIFS (URLs fictives pour le jeu de test)
INSERT INTO employee_documents
(id, employee_id, document_type, file_url, expiration_date)
VALUES
(1, 1, 'CONTRAT', 'https://example.test/docs/EMP-2026-0001-contrat.pdf', NULL),
(2, 1, 'VISITE_MEDICALE', 'https://example.test/docs/EMP-2026-0001-visite.pdf', '2026-12-05'),
(3, 2, 'CONTRAT', 'https://example.test/docs/EMP-2026-0002-contrat.pdf', NULL),
(4, 3, 'RIB', 'https://example.test/docs/EMP-2026-0003-rib.pdf', NULL);

-- 9) POINTAGES BRUTS
INSERT INTO time_clock_events (id, employee_id, event_type, event_timestamp)
VALUES
(1, 1, 'IN',    '2026-11-10 08:55:00'),
(2, 1, 'BREAK', '2026-11-10 12:30:00'),
(3, 1, 'IN',    '2026-11-10 13:30:00'),
(4, 1, 'OUT',   '2026-11-10 17:45:00'),
(5, 2, 'IN',    '2026-11-10 09:10:00'),
(6, 2, 'BREAK', '2026-11-10 12:45:00'),
(7, 2, 'IN',    '2026-11-10 13:45:00'),
(8, 2, 'OUT',   '2026-11-10 18:00:00'),
(9, 3, 'IN',    '2026-11-10 09:00:00'),
(10, 3, 'BREAK','2026-11-10 12:00:00'),
(11, 3, 'IN',   '2026-11-10 13:00:00');

-- 10) FEUILLES DE TEMPS
INSERT INTO daily_time_sheets
(id, employee_id, work_date, effective_worked_minutes, overtime_minutes,
 has_anomaly, anomaly_type, status)
VALUES
(1, 1, '2026-11-10', 470, 0, FALSE, NULL, 'valide'),
(2, 2, '2026-11-10', 465, 0, FALSE, NULL, 'valide'),
(3, 3, '2026-11-10', 180, 0, TRUE, 'OUBLI_SORTIE', 'soumis'),
(4, 1, '2026-11-11', 510, 30, FALSE, NULL, 'soumis');

-- 11) TYPES DE CONGES
INSERT INTO leave_types (id, name, requires_justification) VALUES
('CP', 'Congés payés', FALSE),
('RTT', 'Réduction du temps de travail', FALSE),
('MALADIE', 'Arrêt maladie', TRUE),
('SANS_SOLDE', 'Congé sans solde', FALSE);

-- 12) SOLDES DE CONGES
INSERT INTO leave_balances
(id, employee_id, leave_type_id, period_year, acquired_days, taken_days, remaining_days)
VALUES
(1, 1, 'CP', 2026, 25.0, 10.0, 15.0),
(2, 1, 'RTT', 2026, 8.0, 2.0, 6.0),
(3, 2, 'CP', 2026, 25.0, 3.0, 22.0),
(4, 2, 'RTT', 2026, 8.0, 1.0, 7.0),
(5, 3, 'CP', 2026, 25.0, 5.0, 20.0),
(6, 4, 'CP', 2026, 5.0, 0.0, 5.0);

-- 13) DEMANDES DE CONGES
INSERT INTO leave_requests
(id, employee_id, leave_type_id, start_date, end_date, total_business_days,
 status, rejection_reason, justification_file_url)
VALUES
(1, 1, 'CP', '2026-11-23', '2026-11-25', 3.0, 'en_attente', NULL, NULL),
(2, 2, 'RTT', '2026-11-16', '2026-11-16', 1.0, 'approuve', NULL, NULL),
(3, 3, 'MALADIE', '2026-11-05', '2026-11-06', 2.0, 'approuve', NULL,
 'https://example.test/justificatifs/absence-3.pdf'),
(4, 4, 'CP', '2026-12-02', '2026-12-04', 3.0, 'refuse',
 'Période déjà fortement sollicitée dans le service.', NULL);

-- Synchroniser les séquences si les colonnes SERIAL sont utilisées plus tard.
COMMIT;

-- Vérifications rapides :
-- SELECT * FROM users;
-- SELECT * FROM departments;
-- SELECT * FROM available_positions;
-- SELECT * FROM candidates;
-- SELECT * FROM employees;
-- SELECT * FROM leave_requests;
