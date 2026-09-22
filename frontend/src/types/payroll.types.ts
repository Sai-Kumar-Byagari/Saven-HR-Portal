import type { UserSummary } from './user.types';

export interface Payroll {
  id: number;
  user_id: number;
  month: number;
  year: number;
  basic: string;
  hra: string;
  allowances: string;
  pf_deduction: string;
  professional_tax: string;
  tds: string;
  other_deductions: string;
  net_pay: string;
  slip_path: string | null;
  generated_by: number;
  created_at: string;
  updated_at: string;
  employee?: UserSummary;
  generator?: UserSummary;
}

export interface GeneratePayslipRequest {
  user_id: number;
  month: number;
  year: number;
  basic: number;
  hra?: number;
  allowances?: number;
  pf_deduction?: number;
  professional_tax?: number;
  tds?: number;
  other_deductions?: number;
  net_pay: number;
}

export interface PayrollListParams {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  user_id?: number;
}
