import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications.api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectNotifications, setNotifications, markRead, markAllRead, removeNotification } from '../../store/slices/notificationSlice';
import { selectNotificationPanelOpen, closeNotificationPanel } from '../../store/slices/uiSlice';
import { queryClient } from '../../config/queryClient';

const TYPE_DOT = {
  leave: 'bg-blue-500', attendance: 'bg-green-500', recruitment: 'bg-purple-500',
  interview: 'bg-indigo-500', voice: 'bg-pink-500', payroll: 'bg-emerald-500',
  resignation: 'bg-orange-500', policy: 'bg-cyan-500', onboarding: 'bg-teal-500',
  birthday: 'bg-rose-500', festival: 'bg-amber-500', general: 'bg-gray-400',
};

function timeAgo(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '';
  }
}

export default function NotificationPanel() {
  const notificationPanelOpen = useAppSelector(selectNotificationPanelOpen);
  const notifications = useAppSelector(selectNotifications);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!notificationPanelOpen) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        dispatch(closeNotificationPanel());
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notificationPanelOpen, dispatch]);

  // Close on Escape
  useEffect(() => {
    if (!notificationPanelOpen) return;
    function handleKey(e) { if (e.key === 'Escape') dispatch(closeNotificationPanel()); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [notificationPanelOpen, dispatch]);

  const { isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await notificationsApi.getAll({ limit: 25 });
      dispatch(setNotifications(res.data.data || []));
      return res.data.data;
    },
    enabled: notificationPanelOpen,
    staleTime: 0,
  });

  // Delete notification on click (removes it permanently from the list)
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: (_, id) => {
      dispatch(removeNotification(id));
      // Immediately refetch the server count so the badge stays in sync
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      queryClient.refetchQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      dispatch(markAllRead());
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      queryClient.refetchQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
  });

  function handleClick(n) {
    // Delete notification when user clicks it, then navigate
    deleteMutation.mutate(n.id);
    dispatch(closeNotificationPanel());
    if (n.navigate_to) {
      // Normalise navigate_to — some paths like /my-projects/123 have no matching route.
      // Map them to the closest valid page.
      const path = n.navigate_to;
      let target = path;

      // /my-projects/:id → /my-projects  (employee project detail is embedded in the list page)
      if (/^\/my-projects\/\d+$/.test(path)) target = '/my-projects';
      // /my-teams/:teamId/projects/:id → /teams/:teamId
      if (/^\/my-teams\/\d+\/projects\/\d+$/.test(path)) {
        const teamId = path.split('/')[2];
        target = `/teams/${teamId}`;
      }

      navigate(target);
    }
  }

  if (!notificationPanelOpen) return null;

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] flex flex-col overflow-hidden"
      style={{ maxHeight: '480px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unread > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => dispatch(closeNotificationPanel())}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <svg className="w-12 h-12 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-gray-400">You're all caught up!</p>
          </div>
        )}

        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
          >
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? (TYPE_DOT[n.type] || 'bg-blue-500') : 'bg-gray-200'}`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                {n.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-[11px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
