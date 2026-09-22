import type { UserSummary } from './user.types';

export type VoiceType = 'appreciation' | 'suggestion' | 'grievance' | 'other';

export type VoiceStatus = 'open' | 'acknowledged' | 'resolved';

export interface EmployeeVoice {
  id: number;
  user_id: number;
  type: VoiceType;
  message: string;
  is_anonymous: boolean;
  status: VoiceStatus;
  created_at: string;
  updated_at: string;
  user?: UserSummary;
}

export interface SubmitVoiceRequest {
  type: VoiceType;
  message: string;
  is_anonymous?: boolean;
}
