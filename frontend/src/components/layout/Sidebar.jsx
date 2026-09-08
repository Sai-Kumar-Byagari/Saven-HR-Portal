import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { sidebarGroups } from '../../config/sidebarConfig';
import Avatar from '../ui/Avatar';

/* ─── Inline SVG Icons ──────────────────────────────────────────────────────── */
const IC = {
  LayoutDashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></svg>,
  GitBranch:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>,
  Users:           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  UserCog:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  UserPlus:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Clock:           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ClipboardList:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  BarChart2:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  CalendarOff:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 13V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="17" y1="17" x2="23" y2="23"/><line x1="23" y1="17" x2="17" y2="23"/></svg>,
  PlusCircle:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  CheckCircle:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  CalendarCheck:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="16 19 18 21 22 17"/></svg>,
  Briefcase:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  FilePlus:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  Video:           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  MessageSquare:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Inbox:           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
  Calendar:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Receipt:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>,
  DollarSign:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  IndianRupee:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 8c0 4.418 3.582 5 8 5"/></svg>,
  FileText:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  LogOut:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Shield:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Settings:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

function Icon({ name, className = 'w-[15px] h-[15px]' }) {
  return (
    <span className={clsx('shrink-0 flex items-center justify-center', className)} aria-hidden="true">
      {IC[name] || IC.Settings}
    </span>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const role = user?.role;

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen shrink-0 transition-[width] duration-300 ease-in-out',
        'bg-[#0D1520] border-r border-white/[0.05]',
        sidebarCollapsed ? 'w-[60px]' : 'w-[230px]'
      )}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className={clsx(
        'flex items-center h-[58px] shrink-0 border-b border-white/[0.05] px-3',
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {/* Logo — rectangular, wider, click to toggle */}
        <div
          onClick={toggleSidebar}
          className="bg-white/10 border border-white/10 overflow-hidden cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
          style={{ width: sidebarCollapsed ? '44px' : '96px', height: '56px' }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <img
            src="/saven-logo.png"
            alt="Saven Technologies"
            className="w-full h-full object-fill"
          />
        </div>

        {/* Collapse arrow — only when expanded */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-white/20 hover:text-white/60 transition-colors p-1 rounded ml-auto shrink-0"
            aria-label="Collapse sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-1.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        aria-label="Main navigation"
      >
        {sidebarGroups.map((section, si) => {
          const visible = section.items.filter((item) => {
            if (!item.roles.includes(role)) return false;
            // Hide "My Forms" for existing employees (they don't fill joining forms)
            if (item.path === '/onboarding/my-forms' && user?.employeeType === 'existing') return false;
            return true;
          });
          if (!visible.length) return null;

          return (
            <div key={si}>
              {/* Section label */}
              {section.group && !sidebarCollapsed && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-[0.12em] text-white/25 uppercase select-none">
                  {section.group}
                </p>
              )}
              {section.group && sidebarCollapsed && (
                <div className="mx-2.5 my-2 h-px bg-white/[0.06]" />
              )}

              {visible.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-2.5 mx-2 my-px rounded-lg text-[13px] font-medium transition-all duration-100',
                      sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                      isActive
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-white/45 hover:text-white hover:bg-white/[0.06]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={clsx(
                          'w-[17px] h-[17px] shrink-0 transition-colors',
                          isActive ? 'text-blue-300' : 'text-white/40 group-hover:text-white/80'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate leading-none">{item.label}</span>
                      )}
                      {/* Active indicator — slim left border glow */}
                      {isActive && !sidebarCollapsed && (
                        <span className="ml-auto w-1 h-1 rounded-full bg-white/60" aria-hidden="true" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── User footer ──────────────────────────────────────────── */}
      <div className={clsx(
        'border-t border-white/[0.05] py-2 shrink-0',
        sidebarCollapsed ? 'flex flex-col items-center gap-1.5 px-0' : 'px-2'
      )}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors group">
            <Avatar
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              role={user?.role}
              photo={user?.profilePhoto}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11.5px] font-medium truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-white/25 text-[10px] capitalize truncate leading-tight mt-px">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/20 hover:text-red-400 transition-colors p-0.5 shrink-0"
              aria-label="Logout" title="Logout"
            >
              <Icon name="LogOut" className="w-[13px] h-[13px]" />
            </button>
          </div>
        ) : (
          <>
            <Avatar
              name={user ? `${user.firstName} ${user.lastName}` : ''}
              role={user?.role}
              photo={user?.profilePhoto}
              size="sm"
            />
            <button onClick={handleLogout} className="text-white/20 hover:text-red-400 transition-colors p-1"
              aria-label="Logout" title="Logout">
              <Icon name="LogOut" className="w-[13px] h-[13px]" />
            </button>
            <button onClick={toggleSidebar} className="text-white/15 hover:text-white/50 transition-colors p-1"
              aria-label="Expand" title="Expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
