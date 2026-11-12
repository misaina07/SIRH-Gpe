export type WorkRegime = 'FORFAIT_JOURS_218' | 'HEBDO_35H' | 'HEBDO_39H';

// Types conservés pour l'annuaire et les fixtures historiques de `dev`.
export type EmployeeStatus = 'actif' | 'suspendu' | 'sorti';

export interface Employee {
  id: number;
  matricule: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  emailPro: string;
  phone: string | null;
  birthDate: string;
  hireDate: string;
  departmentId: string;
  managerId: string | null;
  contractType: string;
  monthlySalary: number;
  status: EmployeeStatus;
  createdAt: string;
  jobTitle: string;
  documents: EmployeeDocument[];
  careerEvents: CareerEvent[];
}

export type EmployeeDocumentStatus = 'valid' | 'expiring' | 'expired' | 'unknown';

export interface EmployeeDocument {
  id: string;
  employeeId: number;
  name: string;
  documentType: string;
  fileName?: string;
  uploadedAt?: string;
  expiresAt?: string;
  status: EmployeeDocumentStatus;
}

export type CareerEventType =
  | 'hire'
  | 'probation-completed'
  | 'promotion'
  | 'department-change'
  | 'remote-work-amendment'
  | 'role-change'
  | 'contract-end';

export interface CareerEvent {
  id: string;
  employeeId: number;
  type: CareerEventType;
  title: string;
  description?: string;
  occurredAt: string;
  effectiveAt?: string;
  authorName?: string;
  documentId?: string;
}

export type TeamCalendarEventType = 'office' | 'remote' | 'leave' | 'absence' | 'unavailable';

export interface TeamCalendarEvent {
  id: string;
  employeeId: number;
  employeeName: string;
  employeeInitials: string;
  departmentId: string;
  departmentName: string;
  type: TeamCalendarEventType;
  startsAt: string;
  endsAt: string;
  title?: string;
  color?: string;
}

export interface EmployeeProfile {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  emailPro: string;
  phone?: string | null;
  birthDate: string;
  hireDate: string;
  departmentId: string;
  departmentName: string;
  managerId: string | null;
  managerName: string | null;
  contractType: string;
  grade?: string | null;
  jobTitle?: string | null;
  workRegime?: WorkRegime | null;
  workPercentage?: number | null;
  monthlySalary?: number | null;
  status: 'actif' | 'suspendu' | 'sorti';
  nationality?: string | null;
  nationalId?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressZip?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  trialPeriodEnd?: string | null;
  contractEndDate?: string | null;
  personalEmail?: string | null;
  officeLocation?: string | null;
  teleworkDays?: string[];
  exitDate?: string | null;
  anonymized?: boolean;
  coefficient?: string | null;
  fixedBonus?: number | null;
  variableBonus?: number | null;
  companyVehicle?: boolean | null;
  companyHealthPlan?: boolean | null;
  mealVouchers?: boolean | null;
  ibanMasked?: string | null;
  skills?: string[];
  executive?: boolean | null;
}

export interface EmployeeManagerOption {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  teamSize: number;
}

export interface EmployeeCareerEvent {
  id: number;
  type: string;
  eventDate: string;
  title: string;
  description?: string | null;
}

export interface EmployeeContract {
  id: number;
  contractType: string;
  startDate: string;
  endDate?: string | null;
  trialPeriodEnd?: string | null;
  probationRenewalDate?: string | null;
  grade: string;
  coefficient?: string | null;
  jobTitle: string;
  workRegime: WorkRegime;
  workPercentage: number;
  executive: boolean;
  monthlyGrossSalary?: number | null;
  fixedBonus?: number;
  variableBonus?: number;
  companyVehicle?: boolean | null;
  companyHealthPlan?: boolean | null;
  mealVouchers?: boolean | null;
}

export interface EmployeeDossierDocument {
  id: number;
  employeeId: number;
  documentType: 'CNI' | 'TITRE_SEJOUR' | 'RIB' | 'PERMIS_CONDUIRE' | 'VISITE_MEDICALE' | 'DIPLOME' | 'CONTRAT_SIGNE';
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  expirationDate?: string | null;
  verificationStatus: 'en_attente' | 'valide' | 'rejete' | 'expire';
  verificationNote?: string | null;
  validity: 'valide' | 'en_attente' | 'rejete' | 'expire' | 'expire_bientot';
  uploadedAt: string;
  verifiedAt?: string | null;
}

export interface EmployeeChangeRequest {
  id: number;
  employeeId: number;
  status: 'en_attente' | 'approuvee' | 'refusee';
  reviewedBy?: string | null;
  createdAt: string;
  decisionNote?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressZip?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  ibanMasked?: string | null;
}

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RetentionPolicy {
  dataCategory: 'DOSSIER' | 'DOCUMENTS' | 'CONTRATS' | 'CARRIERE';
  retentionDays: number;
  updatedAt: string;
}
