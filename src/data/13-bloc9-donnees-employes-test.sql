-- Jeu de donnees de test pour la section Evaluation & Formation (Bloc 9).
-- Rejouable : departements requis, employes places en mode UPSERT.
BEGIN;

INSERT INTO departments
(id, code, name, short_name, category, primary_manager_id,
 allocated_budget_annual, consumed_budget_annual, headcount_current, headcount_target)
VALUES
('dept-dsi-cloud', 'DSI-4100', 'DSI - Infrastructure Cloud & DevOps',
 'Infra Cloud', 'Technique', NULL, 420000, 310000, 4, 6),
('dept-dsi-archi', 'DSI-4200', 'DSI - Architecture Logicielle',
 'Architecture', 'Technique', NULL, 350000, 230000, 4, 6),
('dept-rh-recrutement', 'DRH-1200', 'Direction RH - Recrutement & Talents',
 'RH Recrutement', 'RH', NULL, 240000, 180000, 3, 5),
('dept-fin-ctrl', 'DFIN-2100', 'Controle de Gestion',
 'Finance', 'Finance', NULL, 190000, 145000, 3, 4)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    category = EXCLUDED.category;

INSERT INTO employees
(matricule, first_name, last_name, email_pro, phone, birth_date, hire_date,
 department_id, contract_type, monthly_salary, status)
VALUES
('EMP-2026-0001', 'Elodie', 'Martin', 'elodie.martin@entreprise.fr',
 '033 32 20 30 40', '1992-04-12', '2021-06-01',
 'dept-dsi-cloud', 'CDI', 4200.00, 'actif'),
('EMP-2026-0002', 'Thomas', 'Garcia', 'thomas.garcia@entreprise.fr',
 '033 33 21 31 41', '1995-09-23', '2026-11-03',
 'dept-dsi-archi', 'CDI', 3500.00, 'actif'),
('EMP-2026-0003', 'Amelie', 'Morin', 'amelie.morin@entreprise.fr',
 '033 34 22 32 42', '1989-02-08', '2026-11-10',
 'dept-fin-ctrl', 'CDI', 3900.00, 'actif'),
('EMP-2026-0004', 'Lucas', 'Bernard', 'lucas.bernard@entreprise.fr',
 '033 35 23 33 43', '1998-07-19', '2026-11-16',
 'dept-rh-recrutement', 'CDD', 2800.00, 'actif')
ON CONFLICT (matricule) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email_pro = EXCLUDED.email_pro,
    phone = EXCLUDED.phone,
    birth_date = EXCLUDED.birth_date,
    hire_date = EXCLUDED.hire_date,
    department_id = EXCLUDED.department_id,
    contract_type = EXCLUDED.contract_type,
    monthly_salary = EXCLUDED.monthly_salary,
    status = EXCLUDED.status;

INSERT INTO employe_competence(employee_id, competence_id, niveau_attendu, niveau_acquis, date_evaluation)
SELECT e.id, c.id,
       CASE c.code WHEN 'JAVA' THEN 4 WHEN 'REACT' THEN 4 ELSE 3 END,
       CASE c.code WHEN 'JAVA' THEN 3 WHEN 'REACT' THEN 4 ELSE 2 END,
       CURRENT_DATE
FROM employees e
JOIN competence c ON c.code IN ('JAVA', 'REACT', 'SQL')
WHERE e.matricule IN ('EMP-2026-0001', 'EMP-2026-0002')
ON CONFLICT (employee_id, competence_id) DO UPDATE SET
    niveau_attendu = EXCLUDED.niveau_attendu,
    niveau_acquis = EXCLUDED.niveau_acquis,
    date_evaluation = EXCLUDED.date_evaluation;

COMMIT;

-- Verifications :
-- SELECT matricule, first_name, last_name, department_id FROM employees
-- WHERE matricule LIKE 'EMP-2026-%' ORDER BY matricule;
