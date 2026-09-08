export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  HR: 'hr',
  EMPLOYEE: 'employee',
  IT: 'it',
  PAYROLL: 'payroll',
};

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_LABELS = {
  super_admin: 'CEO',
  manager: 'Manager',
  hr: 'HR',
  employee: 'Employee',
  it: 'IT Engineer',
  payroll: 'Payroll Executive',
};

export const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  hr: 'bg-green-100 text-green-800',
  employee: 'bg-gray-100 text-gray-700',
  it: 'bg-orange-100 text-orange-800',
  payroll: 'bg-yellow-100 text-yellow-800',
};
