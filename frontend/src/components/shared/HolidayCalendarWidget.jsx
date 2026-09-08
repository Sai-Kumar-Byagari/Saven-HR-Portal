import { useQuery } from '@tanstack/react-query';
import { holidaysApi } from '../../api/holidays.api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

function getFY(date = new Date()) {
  const m = date.getMonth() + 1, y = date.getFullYear();
  return m >= 4 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`;
}

export default function HolidayCalendarWidget() {
  const today = new Date();
  const fy = getFY();

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', fy],
    queryFn: async () => { const r = await holidaysApi.getAll({ year: fy }); return r.data.data || []; },
    staleTime: 60 * 60 * 1000,
  });

  const holidays = data || [];
  const totalHolidays = holidays.length;
  const passed = holidays.filter((h) => new Date(h.date) < today).length;
  const remaining = totalHolidays - passed;

  const monthStart = startOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(today) });
  const startDow = getDay(monthStart);

  const upcoming = holidays
    .filter((h) => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="h-32 bg-gray-50 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Holiday Calendar</p>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">FY {fy}</span>
      </div>

      {/* FY summary pills */}
      <div className="flex gap-2 mb-3">
        {[
          { label: 'Total', value: totalHolidays, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Passed', value: passed, cls: 'bg-gray-100 text-gray-600' },
          { label: 'Left', value: remaining, cls: 'bg-green-50 text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`flex-1 rounded-lg py-1.5 text-center ${s.cls}`}>
            <p className="text-base font-bold leading-tight">{s.value}</p>
            <p className="text-[10px] opacity-70 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mini calendar */}
      <p className="text-[11px] font-medium text-gray-500 text-center mb-1.5">
        {format(today, 'MMMM yyyy')}
      </p>
      <div className="grid grid-cols-7 gap-px text-center mb-3">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-[10px] text-gray-300 font-semibold py-0.5">{d}</div>
        ))}
        {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day) => {
          const holiday = holidays.find((h) => isSameDay(new Date(h.date), day));
          const isToday  = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              title={holiday?.name}
              className={[
                'relative text-[11px] py-1 rounded cursor-default select-none',
                isToday  ? 'ring-1 ring-blue-500 font-bold' : '',
                holiday  ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Upcoming list */}
      {upcoming.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Upcoming</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-light">
            {upcoming.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-gray-700 truncate">{h.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-gray-400">{format(new Date(h.date), 'dd MMM')}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    h.type === 'national' ? 'bg-red-50 text-red-600' :
                    h.type === 'festival' ? 'bg-orange-50 text-orange-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{h.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-gray-300 text-center py-2">No upcoming holidays</p>
      )}
    </div>
  );
}
