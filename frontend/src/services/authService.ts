import axiosInstance from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api.types';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  SetFirstLoginPasswordRequest,
  SetFirstLoginPasswordResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/auth.types';

async function post<TResponse, TRequest>(
  url: string,
  payload?: TRequest,
): Promise<TResponse> {
  const { data } = await axiosInstance.post<ApiResponse<TResponse>>(url, payload);
  return data.data;
}

export const authService = {
  login: (payload: LoginRequest) =>
    post<LoginResponse, LoginRequest>(API_ENDPOINTS.AUTH.LOGIN, payload),

  logout: () =>
    post<Record<string, never>, undefined>(API_ENDPOINTS.AUTH.LOGOUT),

  setFirstLoginPassword: (payload: SetFirstLoginPasswordRequest) =>
    post<SetFirstLoginPasswordResponse, SetFirstLoginPasswordRequest>(
      API_ENDPOINTS.AUTH.FIRST_LOGIN_SET_PASSWORD,
      payload,
    ),

  forgotPassword: (payload: ForgotPasswordRequest) =>
    post<Record<string, never>, ForgotPasswordRequest>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      payload,
    ),

  verifyOtp: (payload: VerifyOtpRequest) =>
    post<VerifyOtpResponse, VerifyOtpRequest>(API_ENDPOINTS.AUTH.VERIFY_OTP, payload),

  resetPassword: (payload: ResetPasswordRequest) =>
    post<Record<string, never>, ResetPasswordRequest>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      payload,
    ),
};
