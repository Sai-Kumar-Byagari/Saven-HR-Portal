import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { selectUnreadCount, setUnreadCount } from '../../store/slices/notificationSlice';
import { selectNotificationPanelOpen, toggleNotificationPanel } from '../../store/slices/uiSlice';
import { notificationsApi } from '../../api/notifications.api';
import { settingsApi } from '../../api/settings.api';
import { sidebarGroups } from '../../config/sidebarConfig';
import NotificationPanel from './NotificationPanel';
import Avatar from '../ui/Avatar';

// Icon map for sidebar groups and items
const GROUP_ICONS = {
  'Organisation': '🏢', 'Teams & Projects': '👥', 'Attendance': '🕐',
  'Leaves': '📅', 'Recruitment': '💼', 'People': '🤝',
  'Finance': '💰', 'Administration': '⚙️',
};

const PAGE_ICONS = {
  '/dashboard': '🏠', '/orgchart': '🌳', '/directory': '📒',
  '/employees': '👤', '/onboarding/summary': '🚀',
  '/teams': '👥', '/my-projects': '🏗',
  '/attendance/my': '🕐', '/attendance/team': '👀', '/attendance/all': '📊',
  '/leaves/my': '📅', '/leaves/apply': '➕', '/leaves/approval': '✅', '/leaves/management': '📋',
  '/recruitment/positions': '💼', '/recruitment/my-jds': '📄',
  '/recruitment/jd-approvals': '✔️', '/recruitment/create': '📝', '/interviews': '🎥',
  '/voice': '💬', '/voice/inbox': '📬', '/holidays': '🎊',
  '/payroll/my': '💵', '/payroll/manage': '💳',
  '/policies': '📜', '/resignation': '🚪', '/resignation/inbox': '📥',
  '/settings/audit-logs': '🔍', '/settings': '⚙️',
};

export default function Topbar() {
  const user = useAppSelector(selectUser);
  const unreadCount = useAppSelector(selectUnreadCount);
  const notificationPanelOpen = useAppSelector(selectNotificationPanelOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const searchRef = useRef(null);

  // Poll unread count every 30 s
  useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      dispatch(setUnreadCount(res.data.data.count));
      return res.data.data.count;
    },
    refetchInterval: 30000,
    staleTime: 0,
  });

  // ── Navigation search — filter sidebar items by role + label match ──────
  const navResults = useCallback(() => {
    if (!query || query.length < 1 || !user?.role) return [];
    const q = query.toLowerCase();
    const matches = [];
    for (const group of sidebarGroups) {
      for (const item of group.items) {
        if (!item.roles.includes(user.role)) continue;
        const labelLower = item.label.toLowerCase();
        // Match label or group name
        if (labelLower.includes(q) || (group.group || '').toLowerCase().includes(q)) {
          matches.push({
            id: item.path,
            name: item.label,
            subtitle: group.group || 'Navigation',
            icon: PAGE_ICONS[item.path] || (GROUP_ICONS[group.group] || '📌'),
            link: item.path,
            category: 'pages',
          });
        }
      }
    }
    return matches.slice(0, 8);
  }, [query, user?.role]);

  // ── DB search — debounced, for data records ─────────────────────────────
  useEffect(() => {
    if (!query || query.length < 2) { setDbResults(null); return; }
    const t = setTimeout(async () => {
      setLoadingDb(true);
      try {
        const res = await settingsApi.globalSearch(query);
        setDbResults(res.data.data);
      } catch {
        setDbResults(null);
      } finally {
        setLoadingDb(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (query.length > 0) setSearchOpen(true);
    else { setSearchOpen(false); setDbResults(null); }
  }, [query]);

  useEffect(() => {
    const fn = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  function go(link) { setSearchOpen(false); setQuery(''); setDbResults(null); navigate(link); }

  const pages = navResults();
  const DB_LABELS = {
    employees: '👤 People', policies: '📜 Policies', positions: '💼 Job Positions',
    holidays: '🎊 Holidays', leaves: '📅 My Leaves', payslips: '💵 Payslips',
    teams: '👥 Teams', projects: '🏗 Projects', leave_approvals: '✅ Leave Requests',
  };

  const hasAnyResult = pages.length > 0 || (dbResults && Object.values(dbResults).some(a => a?.length > 0));

  return (
    <header className="h-[58px] bg-white border-b border-gray-200 flex items-center px-5 gap-4 shrink-0">
      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <circle cx="11" cy="11" r="8" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"/>
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setSearchOpen(true)}
          placeholder="Search pages, people, positions…"
          aria-label="Global search"
          className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder:text-gray-400"
        />

        {/* Results dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[420px] overflow-y-auto">

            {/* Navigation results — instant */}
            {pages.length > 0 && (
              <div>
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pages</p>
                {pages.map(it => (
                  <button key={it.id} onClick={() => go(it.link)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-blue-50 transition-colors">
                    <span className="text-base w-5 shrink-0 text-center">{it.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-800">{it.name}</p>
                      <p className="text-[11px] text-gray-400">{it.subtitle}</p>
                    </div>
                    <svg className="w-3 h-3 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Divider if both sections */}
            {pages.length > 0 && dbResults && Object.values(dbResults).some(a => a?.length > 0) && (
              <div className="border-t border-gray-100 my-1" />
            )}

            {/* DB results — data records */}
            {dbResults && Object.entries(dbResults).map(([cat, items]) => {
              if (!items || items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {DB_LABELS[cat] || cat}
                  </p>
                  {items.map(it => (
                    <button key={`${cat}-${it.id}`} onClick={() => go(it.link)}
                      className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-blue-50 transition-colors">
                      <span className="text-base w-5 shrink-0 text-center">{it.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-800 truncate">{it.name}</p>
                        {it.subtitle && <p className="text-[11px] text-gray-400 truncate">{it.subtitle}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}

            {/* Loading */}
            {loadingDb && query.length >= 2 && (
              <div className="px-3 py-2 flex items-center gap-2 text-[12px] text-gray-400">
                <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Searching records...
              </div>
            )}

            {/* No results */}
            {!hasAnyResult && !loadingDb && query.length >= 2 && (
              <div className="px-3 py-6 text-center">
                <p className="text-2xl mb-1">🔍</p>
                <p className="text-[13px] text-gray-500 font-medium">No results for "{query}"</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Try: attendance, leaves, payslip, a name…</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification bell */}
      <div className="relative shrink-0">
        <button
          onClick={() => dispatch(toggleNotificationPanel())}
          className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={`${unreadCount} unread notifications`}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationPanel />
      </div>

      {/* Avatar */}
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Profile settings"
      >
        <Avatar name={user ? `${user.firstName} ${user.lastName}` : ''} role={user?.role} photo={user?.profilePhoto} size="sm" />
        <div className="hidden sm:block text-left">
          <p className="text-[13px] font-medium text-gray-800 leading-tight">{user?.firstName} {user?.lastName}</p>
          <p className="text-[11px] text-gray-400 capitalize leading-tight">{user?.role?.replace('_', ' ')}</p>
        </div>
        <svg className="w-3.5 h-3.5 text-gray-300 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
        </svg>
      </button>
    </header>
  );
}

