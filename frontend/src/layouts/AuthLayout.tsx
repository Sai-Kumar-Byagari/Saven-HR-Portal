import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';

export default function AuthLayout() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  if (isAuthenticated && user && !user.isFirstLogin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0D1520] flex-col justify-between p-10">
        <div>
          {/* Logo — your actual image */}
          <div className="mb-12">
            <div className="w-32 h-16 bg-white/10 border border-white/15 overflow-hidden shadow-xl">
              <img src="/saven-logo.png" alt="Saven Technologies" className="w-full h-full object-fill" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-3">
            Manage your workforce<br />
            <span className="text-blue-400">smarter & faster</span>
          </h1>
          <p className="text-white/40 text-base mb-10">
            All-in-one HR platform for Saven Technologies
          </p>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { icon: '👥', title: 'Employee Management',    desc: 'Complete employee lifecycle management' },
              { icon: '📅', title: 'Leave & Attendance',     desc: 'Smart tracking with instant approvals' },
              { icon: '🤖', title: 'AI-Powered Recruitment', desc: 'JD generation, resume shortlisting & evaluation' },
              { icon: '💰', title: 'Payroll Processing',     desc: 'Automated payslips with Indian tax compliance' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-3">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-white/35 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">
          © 2025 Saven Technologies, Hyderabad. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src="/saven-logo.png" alt="Saven" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-gray-900">Saven HR Portal</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
