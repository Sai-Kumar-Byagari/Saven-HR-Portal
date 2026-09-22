export type NotificationType =
  | 'leave'
  | 'attendance'
  | 'recruitment'
  | 'interview'
  | 'voice'
  | 'payroll'
  | 'resignation'
  | 'policy'
  | 'onboarding'
  | 'birthday'
  | 'festival'
  | 'system'
  | 'general';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  reference_id: number | null;
  reference_type: string | null;
  is_read: boolean;
  navigate_to: string | null;
  created_at: string;
  updated_at: string;
}
