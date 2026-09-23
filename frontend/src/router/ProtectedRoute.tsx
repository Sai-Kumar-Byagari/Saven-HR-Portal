import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import type { UserRole } from '../types/auth.types';

// Roles that never need onboarding forms
const FORMS_EXEMPT: UserRole[] = ['super_admin', 'hr', 'payroll'];

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
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
