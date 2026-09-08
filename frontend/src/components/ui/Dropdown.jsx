import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export default function Dropdown({ trigger, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={clsx(
            'absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <hr key={i} className="my-1 border-gray-200" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                disabled={item.disabled}
                className={clsx(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </div>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
