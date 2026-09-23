import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import authReducer, { setAuth } from '@/store/slices/authSlice';
import type { AuthUser, UserRole } from '@/types/auth.types';

function makeUser(role: UserRole = 'employee'): AuthUser {
  return {
    id: 1,
    firstName: 'Asha',
    lastName: 'Rao',
    workEmail: 'asha@saven.tech',
    personalEmail: null,
    empId: 'SAV-001',
    role,
    isFirstLogin: false,
    employeeType: 'existing',
    onboardingComplete: true,
    profilePhoto: null,
    doj: '2026-01-10',
  };
}

function renderGuard(
  element: ReactNode,
  { user, path = '/private' }: { user?: AuthUser; path?: string } = {},
) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (user) {
    store.dispatch(setAuth({ user, accessToken: 'access-token' }));
  }

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route path="/dashboard" element={<div>Dashboard screen</div>} />
          <Route path="/first-login/set-password" element={<div>Password setup</div>} />
          <Route path="/private" element={element} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('route guards', () => {
  it('redirects anonymous users to login', () => {
    renderGuard(<ProtectedRoute><div>Private screen</div></ProtectedRoute>);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('forces first-login users through password setup', () => {
    renderGuard(
      <ProtectedRoute><div>Private screen</div></ProtectedRoute>,
      { user: { ...makeUser(), isFirstLogin: true } },
    );
    expect(screen.getByText('Password setup')).toBeInTheDocument();
  });

  it('renders protected content for an eligible authenticated user', () => {
    renderGuard(
      <ProtectedRoute><div>Private screen</div></ProtectedRoute>,
      { user: makeUser() },
    );
    expect(screen.getByText('Private screen')).toBeInTheDocument();
  });

  it('redirects a user without an allowed role', () => {
    renderGuard(
      <RoleRoute roles={['hr']}><div>HR screen</div></RoleRoute>,
      { user: makeUser('employee') },
    );
    expect(screen.getByText('Dashboard screen')).toBeInTheDocument();
  });

  it('renders content for an allowed role', () => {
    renderGuard(
      <RoleRoute roles={['hr']}><div>HR screen</div></RoleRoute>,
      { user: makeUser('hr') },
    );
    expect(screen.getByText('HR screen')).toBeInTheDocument();
  });
});
