-- Bloc 8 / données de démonstration pour la paie.
-- À exécuter après les migrations 02 à 08.
BEGIN;

INSERT INTO employees (
    matricule,user_id,first_name,last_name,email_pro,phone,birth_date,hire_date,
    department_id,manager_id,contract_type,monthly_salary,status
) VALUES
    ('EMP-2026-0001',NULL,'Élodie','Martin','elodie.martin@entreprise.fr','+261 32 10 000 01','1992-04-12','2021-06-01','dept-dsi-cloud','usr-2','CDI',250000,'actif'),
    ('EMP-2026-0002',NULL,'Thomas','Garcia','thomas.garcia@entreprise.fr','+261 32 10 000 02','1995-09-23','2026-11-03','dept-dsi-archi','usr-2','CDI',300000,'actif'),
    ('EMP-2026-0003',NULL,'Amélie','Morin','amelie.morin@entreprise.fr','+261 32 10 000 03','1989-02-08','2026-11-10','dept-fin-ctrl','usr-3','CDI',441000,'actif'),
    ('EMP-2026-0004',NULL,'Lucas','Bernard','lucas.bernard@entreprise.fr','+261 32 10 000 04','1998-07-19','2026-11-16','dept-rh-recrutement','usr-1','CDD',308700,'actif'),
    ('EMP-2026-0005',NULL,'Noro','Rakotobe','noro.rakotobe@entreprise.fr','+261 32 10 000 05','1990-01-20','2024-02-01','dept-dsi-cyber','usr-2','CDI',3000000,'actif'),
    ('EMP-2026-0006',NULL,'Hery','Rafanomezantsoa','hery.rafanomezantsoa@entreprise.fr','+261 32 10 000 06','1987-06-15','2023-09-01','dept-dsi-data','usr-5','CDI',5000000,'actif')
ON CONFLICT (matricule) DO UPDATE SET
    first_name=EXCLUDED.first_name,
    last_name=EXCLUDED.last_name,
    email_pro=EXCLUDED.email_pro,
    phone=EXCLUDED.phone,
    department_id=EXCLUDED.department_id,
    manager_id=EXCLUDED.manager_id,
    contract_type=EXCLUDED.contract_type,
    monthly_salary=EXCLUDED.monthly_salary,
    status='actif';

-- Contrats mensuels de novembre 2026.
WITH source AS (
    SELECT e.id,e.matricule,e.monthly_salary,e.department_id,e.contract_type,e.hire_date
    FROM employees e
    WHERE e.matricule BETWEEN 'EMP-2026-0001' AND 'EMP-2026-0006'
)
INSERT INTO employee_contracts (
    employee_id,contract_type,start_date,end_date,trial_period_end,grade,coefficient,
    job_title,work_regime,work_percentage,is_executive,monthly_gross_salary,
    fixed_bonus,variable_bonus
)
SELECT s.id,
       s.contract_type,
       CASE WHEN s.hire_date > DATE '2026-11-01' THEN s.hire_date ELSE DATE '2026-11-01' END,
       NULL,
       CASE WHEN s.contract_type='CDD' THEN DATE '2027-02-28' ELSE NULL END,
       CASE s.matricule
           WHEN 'EMP-2026-0001' THEN 'G3'
           WHEN 'EMP-2026-0002' THEN 'G4'
           WHEN 'EMP-2026-0003' THEN 'G5'
           WHEN 'EMP-2026-0004' THEN 'G2'
           WHEN 'EMP-2026-0005' THEN 'G7'
           ELSE 'G8'
       END,
       CASE s.matricule WHEN 'EMP-2026-0005' THEN 'HC' ELSE '5B' END,
       CASE s.matricule
           WHEN 'EMP-2026-0001' THEN 'Ingénieure Cloud'
           WHEN 'EMP-2026-0002' THEN 'Architecte TypeScript'
           WHEN 'EMP-2026-0003' THEN 'Contrôleuse de gestion'
           WHEN 'EMP-2026-0004' THEN 'Chargé de recrutement'
           WHEN 'EMP-2026-0005' THEN 'Architecte cybersécurité'
           ELSE 'Responsable Data & IA'
       END,
       'HEBDO_35H',
       100,
       s.monthly_salary >= 3000000,
       s.monthly_salary,
       CASE s.matricule
           WHEN 'EMP-2026-0001' THEN 25000
           WHEN 'EMP-2026-0003' THEN 50000
           WHEN 'EMP-2026-0005' THEN 150000
           ELSE 0
       END,
       CASE s.matricule
           WHEN 'EMP-2026-0006' THEN 100000
           ELSE 0
       END
FROM source s
WHERE NOT EXISTS (
    SELECT 1 FROM employee_contracts ec
    WHERE ec.employee_id=s.id
      AND ec.start_date<=DATE '2026-11-30'
      AND (ec.end_date IS NULL OR ec.end_date>=DATE '2026-11-01')
);

-- Période de paie et feuilles de temps de novembre.
INSERT INTO periode_paie(annee,mois,date_debut,date_fin)
VALUES (2026,11,DATE '2026-11-01',DATE '2026-11-30')
ON CONFLICT(annee,mois) DO UPDATE SET
    date_debut=EXCLUDED.date_debut,
    date_fin=EXCLUDED.date_fin;

-- Rubriques nécessaires aux variables manuelles.
-- Ce bloc rend aussi le fichier 09 rejouable indépendamment de 08.
INSERT INTO rubrique_paie(code,libelle,type) VALUES
    ('INDEMNITE','Indemnités','GAIN'),
    ('RAPPEL','Rappel de salaire','GAIN'),
    ('HS_25','Heures supplémentaires première tranche','GAIN'),
    ('HS_50','Heures supplémentaires deuxième tranche','GAIN'),
    ('NUIT','Majoration de nuit','GAIN'),
    ('DIMANCHE','Majoration du dimanche','GAIN'),
    ('FERIE','Majoration des jours fériés','GAIN'),
    ('ABSENCE','Retenue pour absence','RETENUE'),
    ('SANS_SOLDE','Congé sans solde','RETENUE'),
    ('AVANCE','Avance sur salaire','RETENUE'),
    ('RETENUE_DISC','Retenue disciplinaire','RETENUE'),
    ('CNAPS_SALARIE','CNaPS salarié','RETENUE'),
    ('CNAPS_EMPLOYEUR','CNaPS employeur','GAIN'),
    ('OSTIE_SALARIE','OSTIE salarié','RETENUE'),
    ('OSTIE_EMPLOYEUR','OSTIE employeur','GAIN'),
    ('IRSA','Impôt retenu à la source','RETENUE')
ON CONFLICT(code) DO UPDATE SET
    libelle=EXCLUDED.libelle,
    type=EXCLUDED.type;

CREATE UNIQUE INDEX IF NOT EXISTS ux_variable_paie_manual_demo
    ON variable_paie(periode_id,employee_id,rubrique_code,COALESCE(semaine,0));

WITH weekdays AS (
    SELECT d::date AS work_date
    FROM generate_series(DATE '2026-11-01',DATE '2026-11-30',INTERVAL '1 day') d
    WHERE extract(dow FROM d) BETWEEN 1 AND 5
),
employees AS (
    SELECT id,matricule FROM employees
    WHERE matricule BETWEEN 'EMP-2026-0001' AND 'EMP-2026-0006'
)
INSERT INTO daily_time_sheets (
    employee_id,work_date,effective_worked_minutes,pause_minutes,
    overtime_25_minutes,overtime_50_minutes,regular_work_minutes,
    first_in,last_out,status
)
SELECT e.id,w.work_date,
       480,60,
       CASE WHEN e.matricule='EMP-2026-0001' AND w.work_date=DATE '2026-11-06' THEN 480 ELSE 0 END,
       CASE WHEN e.matricule='EMP-2026-0001' AND w.work_date=DATE '2026-11-13' THEN 240 ELSE 0 END,
       420,
       (w.work_date + TIME '08:00')::TIMESTAMPTZ,
       (w.work_date + TIME '17:00')::TIMESTAMPTZ,
       'valide'
FROM weekdays w CROSS JOIN employees e
ON CONFLICT(employee_id,work_date) DO UPDATE SET
    effective_worked_minutes=EXCLUDED.effective_worked_minutes,
    overtime_25_minutes=EXCLUDED.overtime_25_minutes,
    overtime_50_minutes=EXCLUDED.overtime_50_minutes,
    status='valide';

-- Une absence approuvée pour tester la retenue sur absence.
INSERT INTO leave_requests (
    employee_id,leave_type_id,start_date,end_date,start_portion,end_portion,
    period_start,period_end,total_business_days,status,submitted_by,
    manager_reviewed_by,rh_reviewed_by,reason_detail,
    requires_justification_snapshot,requires_rh_approval_snapshot
)
SELECT e.id,'SANS_SOLDE',DATE '2026-11-25',DATE '2026-11-26',
       'FULL','FULL',
       TIMESTAMP '2026-11-25 00:00:00',
       TIMESTAMP '2026-11-27 00:00:00',
       2,'approuve','usr-2','usr-2','usr-1',
       'Absence personnelle exceptionnelle',FALSE,TRUE
FROM employees e
WHERE e.matricule='EMP-2026-0001'
ON CONFLICT DO NOTHING;

-- Variables manuelles visibles dans l'écran Paie.
INSERT INTO variable_paie(
    periode_id,employee_id,rubrique_code,quantite,montant,semaine,created_by
)
SELECT p.id,e.id,'INDEMNITE',1,75000,4,'usr-1'
FROM periode_paie p,employees e
WHERE p.annee=2026 AND p.mois=11
  AND e.matricule='EMP-2026-0002'
ON CONFLICT DO NOTHING;

INSERT INTO variable_paie(
    periode_id,employee_id,rubrique_code,quantite,montant,semaine,created_by
)
SELECT p.id,e.id,'AVANCE',1,50000,4,'usr-1'
FROM periode_paie p,employees e
WHERE p.annee=2026 AND p.mois=11
  AND e.matricule='EMP-2026-0003'
ON CONFLICT DO NOTHING;

COMMIT;
