import clsx from 'clsx';
import Spinner from './Spinner';

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
};

export default function StatCard({ title, value, icon, color = 'blue', loading = false, subtitle }) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-shadow">
      {icon && (
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', c.bg, `border ${c.border}`)}>
          <span className={clsx(c.icon)}>{icon}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-400 font-medium truncate">{title}</p>
        {loading ? (
          <div className="mt-1.5"><Spinner size="sm" /></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value ?? '—'}</p>
        )}
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
