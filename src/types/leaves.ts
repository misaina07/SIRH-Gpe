export type LeavePortion = 'FULL' | 'AM' | 'PM';
export type LeaveDecision = 'APPROUVER' | 'REFUSER' | 'AJUSTER';
export interface LeaveType { id:string; name:string; requires_justification:boolean; requires_balance:boolean; requires_rh_approval:boolean }
export interface LeaveBalance { leave_type_id:string; name:string; period_year:number; acquired_days:number; taken_days:number; remaining_days:number }
export interface LeaveRequest { id:number; employee_id:number; leave_type_id:string; leave_type_name?:string; start_date:string; end_date:string; start_portion:LeavePortion; end_portion:LeavePortion; total_business_days:number; status:string; rejection_reason?:string; decision_note?:string; adjustment_note?:string; reason_detail?:string; has_document?:boolean; first_name?:string; last_name?:string; requires_justification_snapshot?:boolean }
export interface LeavePreview { requestedDays:number; remainingDays:number; projectedRemainingDays:number; sufficientBalance:boolean; overlap:boolean; overlappingRequests:LeaveRequest[]; teamImpact:{otherEmployeesAbsent:number;teamSize:number;warning:boolean;warningRatio:number}; requiresJustification:boolean; requiresRhApproval:boolean }
