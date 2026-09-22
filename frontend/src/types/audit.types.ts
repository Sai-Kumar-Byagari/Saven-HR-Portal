import type { UserSummary } from './user.types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'UPLOAD';

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: AuditAction;
  table_name: string;
  record_id: number | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: UserSummary | null;
}
