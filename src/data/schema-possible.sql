-- ============================================================
-- SCHEMA SIRH
-- PostgreSQL
--
-- IMPORTANT :
--   1. Creer la base separement : CREATE DATABASE sirh;
--   2. Executer ce fichier dans la base sirh :
--      psql -U postgres -d sirh -f schema.sql
--
-- Les identifiants texte (usr-1, req-0042, pos-cloud-1, etc.)
-- reprennent les identifiants de mockData.ts.
-- ============================================================

-- ============================================================
-- 1. UTILISATEURS ET DEPARTEMENTS
-- ============================================================

CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role_type VARCHAR(30) NOT NULL
        CHECK (role_type IN ('RH', 'Manager', 'Finance', 'Direction')),
    role_display_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    initials VARCHAR(10) NOT NULL,
    primary_department VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    allowed_views TEXT[],
    can_validate_rh BOOLEAN NOT NULL DEFAULT FALSE,
    can_validate_finance BOOLEAN NOT NULL DEFAULT FALSE,
    can_validate_direction BOOLEAN NOT NULL DEFAULT FALSE,
    can_create_requisition BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_candidates BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(80) NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('Technique', 'Finance', 'RH', 'Direction', 'Opérations', 'Marketing')),
    primary_manager_id VARCHAR(20) REFERENCES users(id) ON DELETE SET NULL,
    allocated_budget_annual NUMERIC(12,2) NOT NULL DEFAULT 0,
    consumed_budget_annual NUMERIC(12,2) NOT NULL DEFAULT 0,
    headcount_current INT NOT NULL DEFAULT 0,
    headcount_target INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Un responsable peut superviser plusieurs départements.
CREATE TABLE manager_departments (
    manager_id VARCHAR(20) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    PRIMARY KEY (manager_id, department_id)
);

-- ============================================================
-- 2. DEMANDES DE RECRUTEMENT (INITIAL_REQUISITIONS)
-- Une demande existe avant la publication d'un poste.
-- ============================================================

CREATE TABLE requisitions (
    id VARCHAR(30) PRIMARY KEY,              -- Ex: req-0042
    code VARCHAR(30) UNIQUE NOT NULL,        -- Ex: REQ-2026-0042
    title VARCHAR(200) NOT NULL,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id),
    priority VARCHAR(20) NOT NULL
        CHECK (priority IN ('urgente', 'normale', 'basse')),
    manager_in_charge_id VARCHAR(20) REFERENCES users(id) ON DELETE SET NULL,
    budget_variance_status VARCHAR(30) NOT NULL
        CHECK (budget_variance_status IN ('conforme', 'tolerable', 'depassement')),
    contract_type VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    requester_name VARCHAR(150) NOT NULL,
    requester_role VARCHAR(150) NOT NULL,
    creation_date DATE NOT NULL,
    target_start_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(40) NOT NULL
        CHECK (status IN (
            'brouillon',
            'en_cours_rh',
            'en_cours_finance',
            'en_cours_direction',
            'publiee'
        )),
    salary_min NUMERIC(10,2) NOT NULL,
    salary_max NUMERIC(10,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    grade VARCHAR(30) NOT NULL,
    grade_min NUMERIC(10,2),
    grade_max NUMERIC(10,2),
    department_limit_min NUMERIC(10,2),
    department_limit_max NUMERIC(10,2),
    annual_employer_budget NUMERIC(12,2),
    current_step SMALLINT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
    derogation_motive TEXT,
    rh_observations TEXT,
    rh_check_fiche BOOLEAN,
    rh_check_grade BOOLEAN,
    rh_check_coherence BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (salary_min <= salary_max),
    CHECK (grade_min IS NULL OR grade_max IS NULL OR grade_min <= grade_max),
    CHECK (department_limit_min IS NULL OR department_limit_max IS NULL
           OR department_limit_min <= department_limit_max)
);

-- ============================================================
-- 3. POSTES DISPONIBLES (DEPARTMENTS_DATA[].positions)
-- Le code de demande est facultatif : certains postes du mock
-- (ex. REQ-2026-0044) n'ont pas d'entree dans INITIAL_REQUISITIONS.
-- ============================================================

CREATE TABLE available_positions (
    id VARCHAR(30) PRIMARY KEY,              -- Ex: pos-cloud-1
    title VARCHAR(200) NOT NULL,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id),
    grade VARCHAR(10) NOT NULL,
    contract_type VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'brouillon'
        CHECK (status IN ('brouillon', 'en_validation', 'ouvert', 'pourvu')),
    salary_min NUMERIC(10,2) NOT NULL,
    salary_max NUMERIC(10,2) NOT NULL,
    salary_range_label VARCHAR(100) NOT NULL,
    fte NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    priority VARCHAR(20) NOT NULL
        CHECK (priority IN ('urgente', 'normale', 'basse')),
    manager_id VARCHAR(20) NOT NULL REFERENCES users(id),
    location VARCHAR(150) NOT NULL,
    target_date DATE NOT NULL,
    requisition_code VARCHAR(30) UNIQUE REFERENCES requisitions(code) ON DELETE SET NULL,
    description TEXT,
    skills TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (salary_min <= salary_max)
);

-- ============================================================
-- 4. VALIDATIONS ET HISTORIQUE DES DEMANDES
-- ============================================================

CREATE TABLE requisition_approvals (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    requisition_id VARCHAR(30) NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    step_name VARCHAR(50) NOT NULL
        CHECK (step_name IN ('QUALIFICATION_RH', 'ARBITRAGE_FINANCE', 'APPROBATION_DIRECTION')),
    validator_id VARCHAR(20) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'en_attente'
        CHECK (status IN ('en_attente', 'approuve', 'refuse')),
    comments TEXT,
    validated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (requisition_id, step_name)
);

-- Journal d'activite correspondant a AUDIT_TRAIL.
CREATE TABLE requisition_audit_events (
    id VARCHAR(30) PRIMARY KEY,              -- Ex: aud-1
    requisition_id VARCHAR(30) NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    step_name VARCHAR(150) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_title VARCHAR(150) NOT NULL,
    display_date VARCHAR(80) NOT NULL,        -- Conserve aussi "En attente active"
    quote TEXT,
    color VARCHAR(30)
        CHECK (color IN ('emerald', 'amber', 'primary'))
);

-- ============================================================
-- 5. CANDIDATS (CANDIDATES_DATA)
-- mockData ne fournit ni e-mail ni telephone : ces champs restent
-- facultatifs et ne sont pas inventes dans le jeu de test.
-- ============================================================

CREATE TABLE candidates (
    id VARCHAR(30) PRIMARY KEY,              -- Ex: cand-1
    position_id VARCHAR(30) REFERENCES available_positions(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    role_title VARCHAR(150) NOT NULL,
    experience_years NUMERIC(4,1) NOT NULL DEFAULT 0,
    score NUMERIC(2,1),
    skills TEXT[],
    kanban_stage VARCHAR(30) NOT NULL DEFAULT 'recue'
        CHECK (kanban_stage IN ('recue', 'preselectionne', 'entretien', 'retenu', 'refuse')),
    received_days_ago INT,
    milestone VARCHAR(200),
    sla VARCHAR(80),
    status_badge VARCHAR(100),
    notes TEXT,
    salary_expectation VARCHAR(100),
    rejection_reason TEXT,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(50),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (score IS NULL OR (score >= 0 AND score <= 5))
);

-- ============================================================
-- 6. ONBOARDING (ONBOARDING_LIST)
-- ============================================================

CREATE TABLE onboarding_people (
    id VARCHAR(30) PRIMARY KEY,              -- Ex: onb-1
    full_name VARCHAR(150) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    role_title VARCHAR(150) NOT NULL,
    days_remaining INT NOT NULL,
    arrival_date DATE NOT NULL,
    tasks_done INT NOT NULL DEFAULT 0,
    tasks_total INT NOT NULL DEFAULT 0,
    color_scheme VARCHAR(150),
    CHECK (tasks_done >= 0 AND tasks_total >= tasks_done)
);

-- ============================================================
-- 7. REFERENTIEL DES SALARIES ET DOCUMENTS
-- ============================================================

CREATE TABLE employees (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    matricule VARCHAR(20) UNIQUE NOT NULL,
    user_id VARCHAR(20) REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_pro VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    birth_date DATE NOT NULL,
    hire_date DATE NOT NULL,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id),
    manager_id VARCHAR(20) REFERENCES users(id) ON DELETE SET NULL,
    contract_type VARCHAR(30) NOT NULL,
    monthly_salary NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'actif'
        CHECK (status IN ('actif', 'suspendu', 'sorti')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_documents (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    expiration_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. TEMPS DE TRAVAIL ET POINTAGE
-- ============================================================

CREATE TABLE time_clock_events (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('IN', 'BREAK', 'OUT')),
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_time_sheets (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    effective_worked_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,
    has_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_type VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'soumis'
        CHECK (status IN ('soumis', 'valide', 'corrige')),
    UNIQUE (employee_id, work_date)
);

-- ============================================================
-- 9. CONGES ET ABSENCES
-- ============================================================

CREATE TABLE leave_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    requires_justification BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE leave_balances (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(30) NOT NULL REFERENCES leave_types(id),
    period_year INT NOT NULL,
    acquired_days NUMERIC(4,1) NOT NULL DEFAULT 0,
    taken_days NUMERIC(4,1) NOT NULL DEFAULT 0,
    remaining_days NUMERIC(4,1) NOT NULL DEFAULT 0,
    UNIQUE (employee_id, leave_type_id, period_year)
);

CREATE TABLE leave_requests (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(30) NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_business_days NUMERIC(4,1) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'en_attente'
        CHECK (status IN ('en_attente', 'approuve', 'refuse')),
    rejection_reason TEXT,
    justification_file_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date)
);

-- ============================================================
-- 10. INDEX
-- ============================================================

CREATE INDEX idx_departments_manager ON departments(primary_manager_id);
CREATE INDEX idx_manager_departments_department ON manager_departments(department_id);
CREATE INDEX idx_requisitions_department ON requisitions(department_id);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_positions_department ON available_positions(department_id);
CREATE INDEX idx_positions_status ON available_positions(status);
CREATE INDEX idx_candidates_stage ON candidates(kanban_stage);
CREATE INDEX idx_approvals_requisition ON requisition_approvals(requisition_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_time_events_employee ON time_clock_events(employee_id, event_timestamp);
CREATE INDEX idx_leave_requests_dates ON leave_requests(employee_id, start_date, end_date);
