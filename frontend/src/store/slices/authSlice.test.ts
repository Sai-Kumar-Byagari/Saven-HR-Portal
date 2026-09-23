import { describe, expect, it } from 'vitest';
import authReducer, {
  logout,
  setAuth,
  updateAccessToken,
  updateUser,
} from './authSlice';
import type { AuthUser } from '@/types/auth.types';

const user: AuthUser = {
  id: 1,
  firstName: 'Asha',
  lastName: 'Rao',
  workEmail: 'asha@saven.tech',
  personalEmail: null,
  empId: 'SAV-001',
  role: 'employee',
  isFirstLogin: false,
  employeeType: 'existing',
  onboardingComplete: true,
  profilePhoto: null,
  doj: '2026-01-10',
};

describe('authSlice', () => {
  it('stores a successful login and refreshes its access token', () => {
    const authenticated = authReducer(
      { user: null, accessToken: null, isAuthenticated: false },
      setAuth({ user, accessToken: 'token-1' }),
    );

    expect(authenticated).toEqual({
      user,
      accessToken: 'token-1',
      isAuthenticated: true,
    });

    expect(authReducer(authenticated, updateAccessToken('token-2')).accessToken).toBe(
      'token-2',
    );
  });

  it('updates the current user without dropping session data', () => {
    const state = { user, accessToken: 'token-1', isAuthenticated: true };
    const next = authReducer(state, updateUser({ onboardingComplete: false }));

    expect(next.user?.onboardingComplete).toBe(false);
    expect(next.accessToken).toBe('token-1');
  });

  it('clears all session data on logout', () => {
    const state = { user, accessToken: 'token-1', isAuthenticated: true };

    expect(authReducer(state, logout())).toEqual({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });
});

