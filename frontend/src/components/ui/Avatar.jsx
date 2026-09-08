import clsx from 'clsx';

const roleColors = {
  super_admin: 'bg-purple-600',
  manager: 'bg-blue-600',
  hr: 'bg-green-600',
  employee: 'bg-gray-500',
  it: 'bg-orange-500',
  payroll: 'bg-yellow-500',
};

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ name = '', role = 'employee', photo, size = 'md', className = '' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const color = roleColors[role] || 'bg-gray-500';

  if (photo) {
    return (
      <img
        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${photo}`}
        alt={`${name} avatar`}
        className={clsx('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
        color,
        sizes[size],
        className
      )}
      aria-label={`${name} avatar`}
    >
      {initials || '?'}
    </div>
  );
}
