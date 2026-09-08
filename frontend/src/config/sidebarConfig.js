import { ROLES } from './roles';

export const sidebarGroups = [
  {
    group: null,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: Object.values(ROLES) },
    ],
  },
  {
    group: 'Organisation',
    items: [
      { label: 'Org Chart',            path: '/orgchart',              icon: 'GitBranch',   roles: Object.values(ROLES) },
      { label: 'Directory',            path: '/directory',             icon: 'Users',       roles: Object.values(ROLES) },
      { label: 'Employee Management',  path: '/employees',             icon: 'UserCog',     roles: [ROLES.SUPER_ADMIN, ROLES.HR] },
      { label: 'Onboarding',           path: '/onboarding/summary',    icon: 'UserPlus',    roles: [ROLES.SUPER_ADMIN, ROLES.HR] },
      { label: 'Verify Forms',         path: '/onboarding/verify-forms', icon: 'CheckCircle', roles: [ROLES.SUPER_ADMIN, ROLES.HR] },
      { label: 'My Forms',             path: '/onboarding/my-forms',   icon: 'FileText',    roles: [ROLES.EMPLOYEE, ROLES.IT, ROLES.PAYROLL, ROLES.MANAGER] },
    ],
  },
  {
    group: 'Teams & Projects',
    items: [
      { label: 'My Teams',    path: '/teams',        icon: 'Users',     roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
      { label: 'My Projects', path: '/my-projects',  icon: 'Briefcase', roles: [ROLES.EMPLOYEE, ROLES.IT, ROLES.PAYROLL] },
    ],
  },
  {
    group: 'Attendance',
    items: [
      { label: 'My Attendance',   path: '/attendance/my',   icon: 'Clock',         roles: Object.values(ROLES) },
      { label: 'Team Attendance', path: '/attendance/team', icon: 'ClipboardList', roles: [ROLES.MANAGER] },
      { label: 'All Attendance',  path: '/attendance/all',  icon: 'BarChart2',     roles: [ROLES.SUPER_ADMIN, ROLES.PAYROLL] },
    ],
  },
  {
    group: 'Leaves',
    items: [
      { label: 'My Leaves',  path: '/leaves/my',         icon: 'CalendarOff',   roles: Object.values(ROLES) },
      { label: 'Apply Leave',path: '/leaves/apply',      icon: 'PlusCircle',    roles: Object.values(ROLES) },
      { label: 'Approvals',  path: '/leaves/approval',   icon: 'CheckCircle',   roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
      { label: 'Management', path: '/leaves/management', icon: 'CalendarCheck', roles: [ROLES.SUPER_ADMIN, ROLES.PAYROLL] },
    ],
  },
  {
    group: 'Recruitment',
    items: [
      { label: 'Open Positions',  path: '/recruitment/positions',   icon: 'Briefcase',   roles: Object.values(ROLES) },
      { label: 'My JDs',          path: '/recruitment/my-jds',      icon: 'FileText',    roles: [ROLES.SUPER_ADMIN, ROLES.HR] },
      { label: 'JD Approvals',    path: '/recruitment/jd-approvals',icon: 'CheckCircle', roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
      { label: 'Create Position', path: '/recruitment/create',      icon: 'FilePlus',    roles: [ROLES.SUPER_ADMIN, ROLES.HR] },
      { label: 'Interviews',      path: '/interviews',               icon: 'Video',       roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.HR] },
    ],
  },
  {
    group: 'People',
    items: [
      { label: 'Employee Voice',   path: '/voice',       icon: 'MessageSquare', roles: Object.values(ROLES) },
      { label: 'Voice Inbox',      path: '/voice/inbox', icon: 'Inbox',         roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
      { label: 'Holiday Calendar', path: '/holidays',    icon: 'Calendar',      roles: Object.values(ROLES) },
    ],
  },
  {
    group: 'Finance',
    items: [
      { label: 'My Payslips', path: '/payroll/my',     icon: 'Receipt',    roles: Object.values(ROLES) },
      { label: 'Payroll',     path: '/payroll/manage', icon: 'IndianRupee', roles: [ROLES.SUPER_ADMIN, ROLES.PAYROLL] },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Policies',       path: '/policies',            icon: 'FileText', roles: Object.values(ROLES) },
      { label: 'Resignation',    path: '/resignation',         icon: 'LogOut',   roles: Object.values(ROLES) },
      { label: 'Resign. Inbox',  path: '/resignation/inbox',   icon: 'Inbox',    roles: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
      { label: 'Audit Logs',     path: '/settings/audit-logs', icon: 'Shield',   roles: [ROLES.SUPER_ADMIN] },
    ],
  },
  {
    group: null,
    items: [
      { label: 'Settings', path: '/settings', icon: 'Settings', roles: Object.values(ROLES) },
    ],
  },
];

export const sidebarConfig = sidebarGroups.flatMap((g) => g.items);
