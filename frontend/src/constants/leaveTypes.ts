import type { LeaveType } from '@/types/leave.types';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual_leave: 'Casual Leave',
  sick_leave: 'Sick Leave',
  earned_leave: 'Earned Leave',
  maternity_paternity: 'Maternity / Paternity Leave',
  compensatory_off: 'Compensatory Off',
  unpaid_leave: 'Unpaid Leave',
  work_from_home: 'Work From Home',
};

export const LEAVE_TYPES: LeaveType[] = [
  'casual_leave',
  'sick_leave',
  'earned_leave',
  'maternity_paternity',
  'compensatory_off',
  'unpaid_leave',
  'work_from_home',
];
