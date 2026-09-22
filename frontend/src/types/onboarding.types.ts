export interface OnboardingTask {
  id: number;
  user_id: number;
  task_name: string;
  task_key: string | null;
  is_completed: boolean;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export type EmployeeFormStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface QualificationDetail {
  degree: string;
  institution: string;
  year: string;
  percentage: string;
  [key: string]: unknown;
}

export interface EmploymentHistoryEntry {
  company: string;
  designation: string;
  from: string;
  to: string;
  reason_for_leaving: string;
  [key: string]: unknown;
}

export interface FamilyDetail {
  name: string;
  relationship: string;
  age: string;
  occupation: string;
  [key: string]: unknown;
}

export interface TrainingDetail {
  name: string;
  institution: string;
  year: string;
  [key: string]: unknown;
}

export interface EmployeeForm {
  id: number;
  user_id: number;
  letter_date: string | null;
  joining_date: string | null;
  joining_designation: string | null;
  joining_address: string | null;
  signature_name: string | null;
  middle_name: string | null;
  present_address: string | null;
  present_city: string | null;
  present_state: string | null;
  present_pincode: string | null;
  present_phone: string | null;
  permanent_address: string | null;
  permanent_city: string | null;
  permanent_state: string | null;
  permanent_pincode: string | null;
  permanent_phone: string | null;
  designation: string | null;
  blood_group: string | null;
  marital_status: MaritalStatus | null;
  dob: string | null;
  pan_number: string | null;
  place_of_birth: string | null;
  district: string | null;
  aadhaar_number: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_place: string | null;
  emergency_contact_1: string | null;
  emergency_contact_2: string | null;
  qualification_details: QualificationDetail[] | null;
  employment_history: EmploymentHistoryEntry[] | null;
  training_details: TrainingDetail[] | null;
  family_details: FamilyDetail[] | null;
  professional_associations: string | null;
  hobbies: string | null;
  serious_illness: string | null;
  other_info: string | null;
  status: EmployeeFormStatus;
  hr_comment: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}
