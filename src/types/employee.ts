export type WorkRegime = 'FORFAIT_JOURS_218' | 'HEBDO_35H' | 'HEBDO_39H';

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
  grade: string;
  coefficient?: string | null;
  jobTitle: string;
  workRegime: WorkRegime;
  workPercentage: number;
  executive: boolean;
  monthlyGrossSalary?: number | null;
}
