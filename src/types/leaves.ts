export interface LeaveType {
  id: string;
  name: string;
  requiresJustification: boolean;
}

export interface LeaveBalance {
  id: number;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  acquiredDays: number;
  takenDays: number;
  remainingDays: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: string;
  employeeName?: string;
  departmentName?: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalBusinessDays: number;
  status: 'en_attente' | 'approuve' | 'refuse';
  rejectionReason?: string;
  justificationFileUrl?: string;
  createdAt?: string;
}
