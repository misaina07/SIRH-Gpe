export interface PayrollEmployee {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  monthly_gross_salary: number;
  fixed_bonus: number;
  variable_bonus: number;
  work_regime: string;
  effective_worked_minutes: number;
  overtime_25_minutes: number;
  overtime_50_minutes: number;
  night_minutes: number;
  sunday_worked_minutes: number;
  holiday_worked_minutes: number;
  absence_days: number;
  leave_without_pay_days: number;
  manual_variables: Array<{ rubrique_code:string; libelle:string; type:string; quantite:number; montant:number; semaine?:number }>;
}

export interface PayrollLine {
  code:string;
  label:string;
  type:string;
  quantity:number;
  rate:number;
  amount:number;
}

export interface PayrollResult {
  employeeId:number;
  matricule:string;
  grossSalary:number;
  netSalary:number;
  employerCost:number;
  irsa:number;
  warnings:string[];
  lines:PayrollLine[];
}