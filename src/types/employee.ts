/**
 * Correspondance TypeScript de la table PostgreSQL `employees`.
 *
 * Les colonnes DATE et TIMESTAMP sont reçues par le frontend sous forme
 * de chaînes ISO retournées par l'API.
 */
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

export type TeamCalendarEventType =
  | 'office'
  | 'remote'
  | 'leave'
  | 'absence'
  | 'unavailable';

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
