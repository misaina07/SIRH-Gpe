CREATE DATABASE sirh;
\c sirh;

-- Table des utilisateurs / profils (RH, Manager, Finance, Direction)
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role_type VARCHAR(30) NOT NULL CHECK (role_type IN ('RH', 'Manager', 'Finance', 'Direction')),
    role_display_name VARCHAR(100) NOT NULL,
    -- tsy azoko tsara inona reto
    -- avatar_url VARCHAR(255),
    -- initials VARCHAR(10) NOT NULL,
    --
    primary_department VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    can_validate_rh BOOLEAN DEFAULT FALSE,
    can_validate_finance BOOLEAN DEFAULT FALSE,
    can_validate_direction BOOLEAN DEFAULT FALSE,
    can_create_requisition BOOLEAN DEFAULT FALSE,
    can_manage_candidates BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des départements de l'entreprise
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY, -- Ex: 'dept-dsi-cloud', 'drh-1200'
    code VARCHAR(20) UNIQUE NOT NULL, -- Ex: 'DSI-4100'
    name VARCHAR(150) NOT NULL, -- Ex: 'DSI · Infrastructure Cloud & DevOps'
    short_name VARCHAR(50) NOT NULL, -- Ex: 'Infra Cloud'
    category VARCHAR(50) NOT NULL CHECK (category IN ('Technique', 'Finance', 'RH', 'Direction', 'Opérations', 'Marketing')),
    primary_manager_id INT REFERENCES users(id),
    allocated_budget_annual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    consumed_budget_annual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    headcount_current INT DEFAULT 0,
    headcount_target INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison pour les managers multi-départements (ex: Marc Lefebvre supervise 3 départements)
CREATE TABLE manager_departments (
    id INT PRIMARY KEY,
    manager_id INT REFERENCES users(id) ON DELETE CASCADE,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE
);


-- 2. BLOC 1 : CRÉATION DE POSTE PAR LE MANAGER (REQUISITIONS)

CREATE TABLE available_positions (
    id INT PRIMARY KEY,
    code_req VARCHAR(30) UNIQUE NOT NULL, -- Ex: 'REQ-2026-0042'
    title VARCHAR(200) NOT NULL, -- Ex: 'Ingénieur DevOps Senior'
    department_id VARCHAR(50) REFERENCES departments(id) NOT NULL,
    grade VARCHAR(10) NOT NULL, -- Ex: 'G5'
    contract_type VARCHAR(50) NOT NULL, -- Ex: 'CDI — Cadre'
    status VARCHAR(30) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'en_validation', 'ouvert', 'pourvu')),
    salary_min NUMERIC(10, 2) NOT NULL,
    salary_max NUMERIC(10, 2) NOT NULL,
    salary_range_label VARCHAR(100) NOT NULL, -- Ex: '3 000 € – 3 600 € / mois'
    -- 
    fte NUMERIC(3, 2) DEFAULT 1.00, -- Équivalent Temps Plein (ex: 1.0 ETP)
    --
    manager_id INT REFERENCES users(id) NOT NULL,
    location VARCHAR(150) NOT NULL, -- Ex: 'Paris (Hybride)'
    target_date DATE NOT NULL,
    skills TEXT[], -- Tableau de compétences (ex: ARRAY['Kubernetes', 'Terraform', 'Vault'])
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ========================================================
-- 3. BLOCS 2, 3 & 4 : CIRCUIT DE VALIDATION DES VISAS
-- ========================================================

-- Historique et suivi immuable des approbations du workflow (RH, Finance, Direction)
CREATE TABLE position_approvals (
    id INT PRIMARY KEY,
    position_id INT REFERENCES available_positions(id) ON DELETE CASCADE,
    step_name VARCHAR(50) NOT NULL CHECK (step_name IN ('QUALIFICATION_RH', 'ARBITRAGE_FINANCE', 'APPROBATION_DIRECTION')),
    validator_id INT REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'refuse')),
    comments TEXT, -- Observations obligatoires ou motif de dérogation salariale
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ========================================================
-- 4. BLOC 4 : VIVIER CANDIDATS & TABLEAU KANBAN DE RECRUTEMENT
-- ========================================================

CREATE TABLE candidates (
    id INT PRIMARY KEY,
    position_id INT REFERENCES available_positions(id) ON DELETE SET NULL, -- Rattachement au poste vacant
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(255),
    kanban_stage VARCHAR(50) NOT NULL DEFAULT 'recu' CHECK (kanban_stage IN ('recu', 'preselectionne', 'entretien', 'retenu', 'refuse')),
    salary_expectations VARCHAR(100), -- Ex: '45k€ - 50k€'
    rejection_reason TEXT, -- Motif officiel si refusé
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index de performance pour les recherches et filtrages rapides sur le Kanban et les réquisitions
CREATE INDEX idx_positions_department ON available_positions(department_id);
CREATE INDEX idx_positions_status ON available_positions(status);
CREATE INDEX idx_candidates_stage ON candidates(kanban_stage);
CREATE INDEX idx_approvals_position ON position_approvals(position_id);

-- ========================================================
-- 5. BLOC 5 : DOSSIER ADMINISTRATIF DU SALARIÉ (RÉFÉRENTIEL)
-- ========================================================

CREATE TABLE employees (
    id INT PRIMARY KEY,
    matricule VARCHAR(20) UNIQUE NOT NULL, -- Ex: 'EMP-2026-0142'
    user_id INT REFERENCES users(id) ON DELETE SET NULL, -- Lien vers le compte utilisateur s'il se connecte au portail
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_pro VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    birth_date DATE NOT NULL,
    hire_date DATE NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(id) NOT NULL,
    manager_id INT REFERENCES users(id),
    contract_type VARCHAR(20) NOT NULL, -- Ex: 'CDI', 'CDD'
    monthly_salary NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'actif' CHECK (status IN ('actif', 'suspendu', 'sorti')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents administratifs du salarié (GED)
CREATE TABLE employee_documents (
    id INT PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- Ex: 'CNI', 'RIB', 'VISITE_MEDICALE', 'CONTRAT'
    file_url VARCHAR(500) NOT NULL, -- Tsy mbola voatery url
    expiration_date DATE, -- Pour les alertes J-30 (titres de séjour, visites médicales)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ========================================================
-- 6. BLOC 6 : TEMPS DE TRAVAIL & POINTAGE
-- ========================================================

-- Enregistrements bruts des pointages (Arrivée, Pause, Départ)
CREATE TABLE time_clock_events (
    id INT PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('IN', 'BREAK', 'OUT')),
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Feuilles de temps journalières consolidées (avec détection d'anomalies)
CREATE TABLE daily_time_sheets (
    id INT PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    effective_worked_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT DEFAULT 0, -- Heures supplémentaires
    has_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_type VARCHAR(100), -- Ex: 'OUBLI_SORTIE', 'NON_RESPECT_REPOS_11H'
    status VARCHAR(30) DEFAULT 'soumis' CHECK (status IN ('soumis', 'valide', 'corrige')),
    UNIQUE(employee_id, work_date)
);


-- ========================================================
-- 7. BLOC 7 : CONGÉS ET ABSENCES
-- ========================================================

-- Types de congés disponibles (CP, RTT, Maladie, etc.)
CREATE TABLE leave_types (
    id VARCHAR(30) PRIMARY KEY, -- Ex: 'CP', 'RTT', 'MALADIE', 'SANS_SOLDE'
    name VARCHAR(100) NOT NULL, -- Ex: 'Congés Payés'
    requires_justification BOOLEAN DEFAULT FALSE
);

-- Soldes de congés par collaborateur et par année
CREATE TABLE leave_balances (
    id INT PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(30) REFERENCES leave_types(id),
    period_year INT NOT NULL, -- Ex: 2026
    acquired_days NUMERIC(4,1) DEFAULT 0.0,
    taken_days NUMERIC(4,1) DEFAULT 0.0,
    remaining_days NUMERIC(4,1) DEFAULT 0.0,
    UNIQUE(employee_id, leave_type_id, period_year)
);

-- Demandes de congés et d'absences
CREATE TABLE leave_requests (
    id INT PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(30) REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_business_days NUMERIC(4,1) NOT NULL,
    status VARCHAR(30) DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'refuse')),
    rejection_reason TEXT,
    justification_file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ========================================================
-- INDEX DE PERFORMANCE POUR LES BLOCS 5, 6 et 7
-- ========================================================
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_time_events_employee ON time_clock_events(employee_id, event_timestamp);
CREATE INDEX idx_leave_requests_dates ON leave_requests(employee_id, start_date, end_date);