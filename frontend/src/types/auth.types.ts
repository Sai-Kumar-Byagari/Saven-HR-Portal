export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'hr'
  | 'employee'
  | 'it'
  | 'payroll';

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail: string | null;
  empId: string | null;
  role: UserRole;
  isFirstLogin: boolean;
  employeeType: 'new' | 'existing';
  onboardingComplete: boolean;
  profilePhoto: string | null;
  doj: string | null;
  formSubmitted?: boolean;
}

export interface LoginRequest {
  work_email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface SetFirstLoginPasswordRequest {
  new_password: string;
}

export interface SetFirstLoginPasswordResponse {
  isFirstLogin: false;
  employeeType: string;
  onboardingComplete: boolean;
  personalEmail: string | null;
  empId: string | null;
  doj: string | null;
}

export interface ForgotPasswordRequest {
  personal_email: string;
}

export interface VerifyOtpRequest {
  personal_email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verified: true;
}

export interface ResetPasswordRequest {
  personal_email: string;
  otp: string;
  new_password: string;
}
