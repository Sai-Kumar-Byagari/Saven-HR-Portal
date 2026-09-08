import clsx from 'clsx';
import Spinner from './Spinner';

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-600',
  outline:   'border border-gray-200 hover:bg-gray-50 text-gray-700 bg-white',
};

const sizes = {
  xs: 'px-2 py-1 text-[11px] gap-1',
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  className = '', type = 'button', onClick, ...props
}) {
  return (
    <button
      type={type} onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" color="border-current" />}
      {children}
    </button>
  );
}
