import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import PageLoader from '../components/ui/PageLoader';
import Spinner from '../components/ui/Spinner';

// ── Auth ──────────────────────────────────────────────────────────────────────
const LoginPage                = lazy(() => import('../pages/auth/LoginPage'));
const FirstLoginSetPasswordPage= lazy(() => import('../pages/auth/FirstLoginSetPasswordPage'));

// ── Onboarding ────────────────────────────────────────────────────────────────
const OnboardingWizard         = lazy(() => import('../pages/onboarding/OnboardingWizard'));
const EmployeeFormsWizard      = lazy(() => import('../pages/onboarding/EmployeeFormsWizard'));
const HRFormsVerificationPage  = lazy(() => import('../pages/onboarding/HRFormsVerificationPage'));
const MyFormsPage              = lazy(() => import('../pages/onboarding/MyFormsPage'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
const DashboardRouter          = lazy(() => import('../pages/dashboard/DashboardRouter'));

// ── Employees ─────────────────────────────────────────────────────────────────
const EmployeeListPage         = lazy(() => import('../pages/employees/EmployeeListPage'));
const AddEmployeePage          = lazy(() => import('../pages/employees/AddEmployeePage'));
const EmployeeDetailPage       = lazy(() => import('../pages/employees/EmployeeDetailPage'));
const EmployeeEditPage         = lazy(() => import('../pages/employees/EmployeeEditPage'));

// ── Teams & Projects ──────────────────────────────────────────────────────────
const TeamsPage            = lazy(() => import('../pages/teams/TeamsPage'));
const TeamDetailPage       = lazy(() => import('../pages/teams/TeamDetailPage'));
const MyProjectsPage       = lazy(() => import('../pages/teams/MyProjectsPage'));

// ── Directory & Org ───────────────────────────────────────────────────────────
const DirectoryPage            = lazy(() => import('../pages/directory/DirectoryPage'));
const OrgChartPage             = lazy(() => import('../pages/orgchart/OrgChartPage'));
const MyAttendancePage         = lazy(() => import('../pages/attendance/MyAttendancePage'));
const AttendanceReportPage     = lazy(() => import('../pages/attendance/AttendanceReportPage'));

// ── Leaves ────────────────────────────────────────────────────────────────────
const ApplyLeavePage           = lazy(() => import('../pages/leaves/ApplyLeavePage'));
const MyLeavesPage             = lazy(() => import('../pages/leaves/MyLeavesPage'));
const LeaveApprovalPage        = lazy(() => import('../pages/leaves/LeaveApprovalPage'));
const LeaveManagementPage      = lazy(() => import('../pages/leaves/LeaveManagementPage'));

// ── Holidays ──────────────────────────────────────────────────────────────────
const HolidaysPage             = lazy(() => import('../pages/holidays/HolidaysPage'));

// ── Recruitment ───────────────────────────────────────────────────────────────
const OpenPositionsPage        = lazy(() => import('../pages/recruitment/OpenPositionsPage'));
const CreatePositionPage       = lazy(() => import('../pages/recruitment/CreatePositionPage'));
const MyJDsPage                = lazy(() => import('../pages/recruitment/MyJDsPage'));
const JDApprovalsPage          = lazy(() => import('../pages/recruitment/JDApprovalsPage'));
const JDApprovalPage           = lazy(() => import('../pages/recruitment/JDApprovalPage'));
const CandidateListPage        = lazy(() => import('../pages/recruitment/CandidateListPage'));
const CandidateDetailPage      = lazy(() => import('../pages/recruitment/CandidateDetailPage'));

// ── Interviews ────────────────────────────────────────────────────────────────
const InterviewsPage           = lazy(() => import('../pages/interviews/InterviewsPage'));
const RoundDetailPage          = lazy(() => import('../pages/interviews/RoundDetailPage'));

// ── Voice ─────────────────────────────────────────────────────────────────────
const EmployeeVoicePage        = lazy(() => import('../pages/voice/EmployeeVoicePage'));
const VoiceInboxPage           = lazy(() => import('../pages/voice/VoiceInboxPage'));

// ── Payroll ───────────────────────────────────────────────────────────────────
const PayrollPage              = lazy(() => import('../pages/payroll/PayrollPage'));
const MyPayslipsPage           = lazy(() => import('../pages/payroll/MyPayslipsPage'));

// ── Resignation ───────────────────────────────────────────────────────────────
const ResignationFormPage      = lazy(() => import('../pages/resignation/ResignationFormPage'));
const ResignationFeedbackPage  = lazy(() => import('../pages/resignation/ResignationFeedbackPage'));
const ResignationInboxPage     = lazy(() => import('../pages/resignation/ResignationInboxPage'));

// ── Policies ──────────────────────────────────────────────────────────────────
const PoliciesPage             = lazy(() => import('../pages/policies/PoliciesPage'));

// ── Onboarding Summary ────────────────────────────────────────────────────────
const OnboardingSummaryPage    = lazy(() => import('../pages/onboarding/OnboardingSummaryPage'));

// ── Settings ──────────────────────────────────────────────────────────────────
const SettingsPage             = lazy(() => import('../pages/settings/SettingsPage'));
const AuditLogsPage            = lazy(() => import('../pages/settings/AuditLogsPage'));

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="w-full pt-4">
      <PageLoader />
    </div>
  );
}

// Eagerly preload the most visited pages after initial load
function PreloadPages() {
  useEffect(() => {
    const preload = [
      () => import('../pages/dashboard/DashboardRouter'),
      () => import('../pages/attendance/MyAttendancePage'),
      () => import('../pages/leaves/MyLeavesPage'),
      () => import('../pages/directory/DirectoryPage'),
      () => import('../pages/settings/SettingsPage'),
      () => import('../pages/payroll/MyPayslipsPage'),
    ];
    // Stagger preloads to not block the main thread
    preload.forEach((load, i) => {
      setTimeout(load, 300 + i * 200);
    });
  }, []);
  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <PreloadPages />
      {/* Top-level Suspense only for auth pages */}
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50"><Spinner size="lg" /></div>}>
        <Routes>
          {/* ── Public / Auth ───────────────────────────────────── */}
          <Route element={<AuthLayout />}>
            <Route path="/login"           element={<LoginPage />} />
          </Route>

          {/* ── First-login (no sidebar) ────────────────────────── */}
          <Route path="/first-login/set-password"
            element={<ProtectedRoute><FirstLoginSetPasswordPage /></ProtectedRoute>} />

          {/* ── Onboarding wizard (no sidebar) ──────────────────── */}
          <Route path="/onboarding"
            element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

          {/* ── New employee joining forms (no sidebar) ──────────── */}
          <Route path="/onboarding/forms"
            element={<ProtectedRoute><EmployeeFormsWizard /></ProtectedRoute>} />

          {/* ── Protected dashboard routes ───────────────────────── */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Employees */}
            <Route path="/employees" element={<RoleRoute roles={['super_admin','hr']}><EmployeeListPage /></RoleRoute>} />
            <Route path="/employees/add" element={<RoleRoute roles={['super_admin','hr']}><AddEmployeePage /></RoleRoute>} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/:id/edit" element={<RoleRoute roles={['super_admin','hr']}><EmployeeEditPage /></RoleRoute>} />

            {/* Teams & Projects */}
            <Route path="/teams"       element={<RoleRoute roles={['super_admin','manager']}><TeamsPage /></RoleRoute>} />
            <Route path="/teams/:id"   element={<RoleRoute roles={['super_admin','manager']}><TeamDetailPage /></RoleRoute>} />
            <Route path="/my-projects" element={<MyProjectsPage />} />

            {/* Directory & Org */}
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/orgchart"  element={<OrgChartPage />} />

            {/* Attendance */}
            <Route path="/attendance/my"   element={<MyAttendancePage />} />
            <Route path="/attendance/team" element={<RoleRoute roles={['super_admin','manager']}><AttendanceReportPage scope="team" /></RoleRoute>} />
            <Route path="/attendance/all"  element={<RoleRoute roles={['super_admin','payroll']}><AttendanceReportPage scope="all" /></RoleRoute>} />

            {/* Leaves */}
            <Route path="/leaves/apply"      element={<ApplyLeavePage />} />
            <Route path="/leaves/my"         element={<MyLeavesPage />} />
            <Route path="/leaves/approval"   element={<RoleRoute roles={['super_admin','manager']}><LeaveApprovalPage /></RoleRoute>} />
            <Route path="/leaves/management" element={<RoleRoute roles={['super_admin','payroll']}><LeaveManagementPage /></RoleRoute>} />

            {/* Holidays — all roles can view, only admin/hr can manage */}
            <Route path="/holidays" element={<HolidaysPage />} />

            {/* Recruitment */}
            <Route path="/recruitment/positions"          element={<OpenPositionsPage />} />
            <Route path="/recruitment/my-jds"             element={<RoleRoute roles={['super_admin','hr']}><MyJDsPage /></RoleRoute>} />
            <Route path="/recruitment/jd-approvals"       element={<RoleRoute roles={['super_admin','manager']}><JDApprovalsPage /></RoleRoute>} />
            <Route path="/recruitment/create"             element={<RoleRoute roles={['super_admin','hr']}><CreatePositionPage /></RoleRoute>} />
            <Route path="/recruitment/jd-approval/:id"    element={<RoleRoute roles={['super_admin','manager']}><JDApprovalPage /></RoleRoute>} />
            <Route path="/recruitment/:positionId/candidates" element={<RoleRoute roles={['super_admin','hr','manager']}><CandidateListPage /></RoleRoute>} />
            <Route path="/recruitment/candidates/:id"     element={<RoleRoute roles={['super_admin','hr','manager']}><CandidateDetailPage /></RoleRoute>} />

            {/* Interviews */}
            <Route path="/interviews"            element={<RoleRoute roles={['super_admin','hr','manager']}><InterviewsPage /></RoleRoute>} />
            <Route path="/interviews/rounds/:roundId" element={<RoleRoute roles={['super_admin','hr','manager']}><RoundDetailPage /></RoleRoute>} />

            {/* Voice */}
            <Route path="/voice"       element={<EmployeeVoicePage />} />
            <Route path="/voice/inbox" element={<RoleRoute roles={['super_admin','manager']}><VoiceInboxPage /></RoleRoute>} />

            {/* Payroll */}
            <Route path="/payroll/my"     element={<MyPayslipsPage />} />
            <Route path="/payroll/manage" element={<RoleRoute roles={['super_admin','payroll']}><PayrollPage /></RoleRoute>} />

            {/* Resignation */}
            <Route path="/resignation"              element={<ResignationFormPage />} />
            <Route path="/resignation/feedback/:id" element={<ResignationFeedbackPage />} />
            <Route path="/resignation/inbox"        element={<RoleRoute roles={['super_admin','manager']}><ResignationInboxPage /></RoleRoute>} />

            {/* Policies */}
            <Route path="/policies" element={<PoliciesPage />} />

            {/* Onboarding summary */}
            <Route path="/onboarding/summary"      element={<RoleRoute roles={['super_admin','hr']}><OnboardingSummaryPage /></RoleRoute>} />
            <Route path="/onboarding/verify-forms" element={<RoleRoute roles={['super_admin','hr']}><HRFormsVerificationPage /></RoleRoute>} />
            {/* My Forms — employee views their submitted forms with status */}
            <Route path="/onboarding/my-forms"     element={<MyFormsPage />} />

            {/* Settings */}
            <Route path="/settings"            element={<SettingsPage />} />
            <Route path="/settings/audit-logs" element={<RoleRoute roles={['super_admin']}><AuditLogsPage /></RoleRoute>} />

          </Route>

          {/* ── Default redirects ────────────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
