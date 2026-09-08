import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideClose = false }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />
      <div className={clsx('relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[88vh] border border-gray-200', sizeMap[size])}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 id="modal-title" className="text-[15px] font-semibold text-gray-900">{title}</h2>
          {!hideClose && (
            <button onClick={onClose} aria-label="Close"
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-light">{children}</div>
      </div>
    </div>,
    document.body
  );
}
