interface PageErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export default function PageErrorFallback({ error, onReset }: PageErrorFallbackProps) {
  return (
    <div className="w-full flex items-center justify-center py-20 px-4">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-lg text-center shadow-lg">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-4">{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={onReset}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
