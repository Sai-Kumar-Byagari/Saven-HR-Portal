import type { UserSummary } from './user.types';

export type PositionStatus = 'draft' | 'pending_approval' | 'open' | 'closed';

export type CandidateStatus = 'new' | 'shortlisted' | 'rejected' | 'hired' | 'in_progress';

export type AiProcessingStatus = 'pending' | 'evaluated' | 'failed';

export interface JobPosition {
  id: number;
  title: string;
  department: string;
  created_by_hr: number;
  assigned_manager_id: number | null;
  approved_by_manager: number | null;
  status: PositionStatus;
  key_responsibilities: string | null;
  required_skills: string | null;
  experience_years: string | null;
  salary_lpa: string | null;
  deadline: string | null;
  min_score: number;
  rejection_comment: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  hrCreator?: UserSummary;
  assignedManager?: UserSummary | null;
  approvalManager?: UserSummary | null;
  descriptions?: JobDescription[];
  candidates?: Candidate[];
}

export interface JobDescription {
  id: number;
  position_id: number;
  content: string;
  version: number;
  ai_status: 'pending' | 'generated' | 'failed';
  raw_ai_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: number;
  position_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  resume_path: string | null;
  resume_text: string | null;
  ai_score: number | null;
  ai_strengths: string | null;
  ai_gaps: string | null;
  ai_recommendation: string | null;
  ai_status: AiProcessingStatus;
  status: CandidateStatus;
  referred_by: number | null;
  created_at: string;
  updated_at: string;
  position?: JobPosition;
  referrer?: UserSummary | null;
  rounds?: InterviewRound[];
}

export interface CreatePositionRequest {
  title: string;
  department: string;
  assigned_manager_id?: number;
  key_responsibilities?: string;
  required_skills?: string;
  experience_years?: string;
  salary_lpa?: string;
  deadline?: string;
  min_score?: number;
}

export interface UploadCandidateRequest {
  position_id: number;
  name: string;
  email?: string;
  phone?: string;
  resume?: File;
  referred_by?: number;
}

export interface InterviewRound {
  id: number;
  candidate_id: number;
  round_number: 1 | 2 | 3;
  round_type: 'phone' | 'technical' | 'hr';
  recording_path: string | null;
  ai_feedback: string | null;
  ai_score: number | null;
  ai_status: AiProcessingStatus;
  status: 'scheduled' | 'completed' | 'cancelled';
  conducted_by: number | null;
  final_decision: 'selected' | 'rejected' | 'hold' | 'pending';
  decision_comment: string | null;
  scheduled_at: string | null;
  meeting_link: string | null;
  duration_mins: number | null;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  conductor?: UserSummary | null;
  feedbacks?: InterviewFeedback[];
}

export interface InterviewFeedback {
  id: number;
  round_id: number;
  given_by: number | null;
  feedback_text: string;
  score: number | null;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
  feedbackGiver?: UserSummary | null;
}

export interface JdApproval {
  id: number;
  position_id: number;
  manager_id: number;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  min_score: number | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  position?: JobPosition;
  manager?: UserSummary;
}
