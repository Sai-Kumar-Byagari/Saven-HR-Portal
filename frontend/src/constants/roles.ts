import type { UserRole } from '@/types/auth.types';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  HR: 'hr',
  EMPLOYEE: 'employee',
  IT: 'it',
  PAYROLL: 'payroll',
} as const satisfies Record<string, UserRole>;

export const ALL_ROLES: UserRole[] = Object.values(ROLES);

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  hr: 'HR',
  employee: 'Employee',
  it: 'IT Engineer',
  payroll: 'Payroll Executive',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#7C3AED',
  manager: '#2563EB',
  hr: '#059669',
  employee: '#6B7280',
  it: '#D97706',
  payroll: '#DC2626',
};
