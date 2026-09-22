import type { UserRole } from './auth.types';

export interface UserSummary {
  id: number;
  first_name: string;
  last_name: string;
  work_email: string;
}

export interface EmployeeProfile {
  id: number;
  user_id: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  dob: string | null;
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
  phone: string | null;
  emergency_contact: string | null;
  emergency_contact_name: string | null;
  address: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  branch_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  emp_id: string | null;
  first_name: string;
  last_name: string;
  work_email: string;
  personal_email: string | null;
  role: UserRole;
  is_first_login: boolean;
  is_active: boolean;
  employee_type: 'new' | 'existing';
  onboarding_complete: boolean;
  doj: string | null;
  reporting_manager_id: number | null;
  office_location: string;
  profile_photo: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile?: EmployeeProfile | null;
  reportingManager?: UserSummary | null;
}

export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  work_email: string;
  personal_email?: string;
  role: UserRole;
  employee_type?: 'new' | 'existing';
  reporting_manager_id?: number;
  office_location?: string;
  doj?: string;
}

export interface UpdateEmployeeRequest {
  first_name?: string;
  last_name?: string;
  personal_email?: string;
  role?: UserRole;
  is_active?: boolean;
  reporting_manager_id?: number;
  office_location?: string;
  doj?: string;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  is_active?: boolean;
}
