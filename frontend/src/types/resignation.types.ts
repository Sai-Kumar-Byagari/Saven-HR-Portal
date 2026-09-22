import type { UserSummary } from './user.types';

export type ResignationStatus = 'submitted' | 'acknowledged' | 'accepted' | 'rejected';

export interface ResignationForm {
  id: number;
  user_id: number;
  last_working_day: string;
  reason: string;
  notice_period_acknowledgment: boolean;
  status: ResignationStatus;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  employee?: UserSummary;
  feedback?: ResignationFeedback | null;
}

export interface ResignationFeedback {
  id: number;
  resignation_id: number;
  feedback_text: string;
  rating: number;
  reason_for_leaving: string | null;
  suggestions: string | null;
  would_rejoin: boolean | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitResignationRequest {
  last_working_day: string;
  reason: string;
  notice_period_acknowledgment: boolean;
}

export interface SubmitResignationFeedbackRequest {
  feedback_text: string;
  rating: number;
  reason_for_leaving?: string;
  suggestions?: string;
  would_rejoin?: boolean;
}
