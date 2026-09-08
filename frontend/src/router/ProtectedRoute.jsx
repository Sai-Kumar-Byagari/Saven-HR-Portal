import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Roles that never need onboarding forms
const FORMS_EXEMPT = ['super_admin', 'hr', 'payroll'];

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Step 1: Force first-login password change ─────────────────────────────
  if (user.isFirstLogin && location.pathname !== '/first-login/set-password') {
    return <Navigate to="/first-login/set-password" replace />;
  }

  const onSettings = location.pathname.startsWith('/settings');
  const onForms    = location.pathname.startsWith('/onboarding/forms');
  const onMyForms  = location.pathname.startsWith('/onboarding/my-forms');
  const onAny      = onSettings || onForms || onMyForms;

  // ── Step 2: New employees fill joining forms before anything else ──────────
  const formSubmitted = user.formSubmitted ||
    (user?.id && localStorage.getItem(`form_submitted_${user.id}`) === 'true');

  if (
    !user.isFirstLogin &&
    !FORMS_EXEMPT.includes(user.role) &&
    user.employeeType === 'new' &&
    !formSubmitted &&
    !onForms && !onSettings
  ) {
    return <Navigate to="/onboarding/forms" replace />;
  }

  // ── Step 3: Profile not complete — redirect to settings (soft, not hard-block) ──
  // Only redirect if coming from login flow (setup=1 query param set by FirstLogin/FormsWizard)
  // After they visit settings once, they can go to dashboard
  // We don't hard-block because onboardingComplete is set only after OnboardingWizard
  // For now: allow through — the Settings page shows the "Complete your profile" banner

  return children;
}
