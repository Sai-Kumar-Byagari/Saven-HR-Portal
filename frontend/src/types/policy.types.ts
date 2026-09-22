import type { UserSummary } from './user.types';

export type PolicyCategory =
  | 'Leave Policy'
  | 'Code of Conduct'
  | 'IT Policy'
  | 'HR Policy'
  | 'Finance Policy'
  | 'Travel Policy'
  | 'Other';

export interface Policy {
  id: number;
  title: string;
  category: PolicyCategory;
  file_path: string;
  original_name: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  uploader?: UserSummary;
}

export interface UploadPolicyRequest {
  title: string;
  category?: PolicyCategory;
  file: File;
}
