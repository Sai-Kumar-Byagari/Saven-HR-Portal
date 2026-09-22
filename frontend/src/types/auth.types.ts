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
}

export interface LoginRequest {
  workEmail: string;
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
  currentPassword: string;
  newPassword: string;
  personalEmail: string;
}

export interface SetFirstLoginPasswordResponse {
  isFirstLogin: false;
  employeeType: string;
  onboardingComplete: boolean;
  personalEmail: string;
  empId: string;
  doj: string;
}

export interface ForgotPasswordRequest {
  personalEmail: string;
}

export interface VerifyOtpRequest {
  personalEmail: string;
  otp: string;
}

export interface ResetPasswordRequest {
  personalEmail: string;
  otp: string;
  newPassword: string;
}
