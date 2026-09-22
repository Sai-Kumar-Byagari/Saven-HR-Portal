import type { UserSummary } from './user.types';

export type AttendanceStatus = 'present' | 'absent' | 'on_leave';

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  clock_in: string | null;
  punch_in_photo: string | null;
  clock_out: string | null;
  punch_out_photo: string | null;
  duration_mins: number | null;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  user?: UserSummary;
}

export interface ClockInRequest {
  punch_in_photo?: File;
}

export interface ClockOutRequest {
  punch_out_photo?: File;
}

export interface AttendanceReportParams {
  page?: number;
  limit?: number;
  user_id?: number;
  from_date?: string;
  to_date?: string;
  status?: AttendanceStatus;
}
