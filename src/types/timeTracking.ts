export type ClockEventType = 'IN' | 'BREAK' | 'RESUME' | 'OUT';
export interface ClockEvent { id: number; event_type?: ClockEventType; eventType?: ClockEventType; event_timestamp?: string; eventTimestamp?: string; is_regularized?: boolean; isRegularized?: boolean }
export interface TodayClock { employeeId: number; date: string; serverNow: string; events: ClockEvent[]; workedMinutes: number; nextAction: ClockEventType | 'TERMINE' }
export interface TimeSheet { employee_id: number; first_name: string; last_name: string; work_date: string; effective_worked_minutes: number; pause_minutes: number; overtime_25_minutes: number; overtime_50_minutes: number; has_anomaly: boolean; anomaly_codes: string[]; status: string }
export interface Regularization { id: number; first_name: string; last_name: string; employee_id: number; event_type: ClockEventType; requested_at: string; reason: string; status: string }
