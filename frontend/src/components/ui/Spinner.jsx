import clsx from 'clsx';

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
};

export default function Spinner({ size = 'md', className = '', color = 'border-blue-600' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'rounded-full border-t-transparent animate-spin',
        sizes[size],
        color,
        className
      )}
    />
  );
}
