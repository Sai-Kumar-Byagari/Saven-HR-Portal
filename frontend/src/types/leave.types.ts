import type { UserSummary } from './user.types';

export type LeaveType =
  | 'casual_leave'
  | 'sick_leave'
  | 'earned_leave'
  | 'maternity_paternity'
  | 'compensatory_off'
  | 'unpaid_leave'
  | 'work_from_home';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface Leave {
  id: number;
  user_id: number;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  days: string;
  reason: string;
  status: LeaveStatus;
  approved_by: number | null;
  approver_comment: string | null;
  applied_at: string;
  created_at: string;
  updated_at: string;
  user?: UserSummary;
  approver?: UserSummary | null;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  financial_year: string;
  total_leaves: number;
  used_leaves: string;
  current_month_used: string;
  created_at: string;
  updated_at: string;
}

export interface ApplyLeaveRequest {
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
}

export interface LeaveActionRequest {
  status: 'approved' | 'rejected';
  approver_comment?: string;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  year?: number;
}
