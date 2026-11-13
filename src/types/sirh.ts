export type ViewMode = 
  | 'tableau-de-bord'
  | 'mes-demandes'
  | 'nouvelle-demande'
  | 'recrutement'
  | 'validation-finance'
  | 'qualification-rh'
  | 'approbation-direction'
  | 'employes-contrats'
  | 'onboarding'
  | 'conges-absences'
  | 'referentiels-admin'
  | 'connexion';

export type UserRole = 'RH' | 'Manager' | 'Finance' | 'Direction';

export interface AvailablePosition {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  grade: string;
  contractType: string;
  status: 'ouvert' | 'en_validation' | 'pourvu' | 'brouillon';
  salaryMin: number;
  salaryMax: number;
  salaryRange: string;
  fte: number; // ETP (Ex: 1.0, 0.8)
  priority: 'urgente' | 'normale' | 'basse';
  managerId: string;
  managerName: string;
  managerEmail: string;
  location: string;
  targetDate: string;
  requisitionCode?: string;
  description?: string;
  skills?: string[];
}

export interface Department {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: 'Technique' | 'Finance' | 'RH' | 'Direction' | 'Opérations' | 'Marketing';
  primaryManagerId: string;
  primaryManagerName: string;
  primaryManagerRole: string;
  allocatedBudgetAnnual: number;
  consumedBudgetAnnual: number;
  headcountCurrent: number;
  headcountTarget: number;
  openPositionsCount: number;
  positions: AvailablePosition[];
}

export interface SavedLoginEmail {
  email: string;
  name: string;
  role: string;
  roleType: UserRole;
  avatar?: string;
  department?: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  roleType: UserRole;
  email: string;
  avatar: string;
  initials: string;
  department: string;
  managedDepartmentIds?: string[]; // A manager can oversee multiple departments
  managedDepartmentNames?: string[];
  description?: string;
  allowedViews: ViewMode[];
  canValidateRH?: boolean;
  canValidateFinance?: boolean;
  canValidateDirection?: boolean;
  canCreateRequisition?: boolean;
  canManageCandidates?: boolean;
}

export type CandidateStage = 'recue' | 'preselectionne' | 'entretien' | 'retenu' | 'refuse';

export interface Candidate {
  id: string;
  name: string;
  initials: string;
  roleTitle: string;
  experienceYears: number;
  score: number;
  skills: string[];
  stage: CandidateStage;
  receivedDaysAgo: number;
  statusBadge?: string;
  milestone?: string;
  sla?: string;
  notes?: string;
  rejectionReason?: string;
  salaryExpectation?: string;
}

export interface Requisition {
  id: string;
  code: string;
  title: string;
  department: string;
  departmentCode: string;
  contractType: string;
  location: string;
  requesterName: string;
  requesterRole: string;
  creationDate: string;
  targetStartDate: string;
  reason: string;
  status: 'brouillon' | 'en_cours_rh' | 'en_cours_finance' | 'en_cours_direction' | 'publiee' | 'rejetee';
  salaryMin: number;
  salaryMax: number;
  currency: string;
  grade: string;
  gradeMin: number;
  gradeMax: number;
  departmentLimitMin: number;
  departmentLimitMax: number;
  annualEmployerBudget: number;
  currentStep: number; // 1: Manager, 2: RH, 3: Finance, 4: Direction
  departmentId?: string;
  priority?: 'urgente' | 'normale' | 'basse';
  managerInCharge?: string;
  budgetVarianceStatus?: 'conforme' | 'tolerable' | 'depassement';
  derogationMotive?: string;
  rhObservations?: string;
  rhCheckFiche?: boolean;
  rhCheckGrade?: boolean;
  rhCheckCoherence?: boolean;
}

export interface OnboardingPerson {
  id: string;
  name: string;
  initials: string;
  department: string;
  roleTitle: string;
  daysRemaining: number;
  arrivalDate: string;
  tasksDone: number;
  tasksTotal: number;
  colorScheme: string;
}

export interface AuditEvent {
  id: string;
  stepName: string;
  author: string;
  authorTitle: string;
  dateStr: string;
  quote?: string;
  badge?: string;
  hash?: string;
  color: 'emerald' | 'amber' | 'primary' | 'sky';
}
