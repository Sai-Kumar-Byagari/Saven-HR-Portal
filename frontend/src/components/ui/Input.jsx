import clsx from 'clsx';
import { forwardRef, useState } from 'react';

const Input = forwardRef(function Input(
  { label, error, className = '', type = 'text', required, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={clsx(
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            isPassword ? 'pr-10' : '',
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-gray-300 bg-white focus:border-blue-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {/* Eye toggle for password fields */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            aria-label={showPwd ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPwd ? (
              /* Eye-off icon */
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Eye icon */
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
