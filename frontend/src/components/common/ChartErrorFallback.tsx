interface ChartErrorFallbackProps {
  title?: string;
}

export default function ChartErrorFallback({ title }: ChartErrorFallbackProps) {
  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center p-4">
        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-gray-500">{title ? `${title} failed to load` : 'Chart failed to load'}</p>
      </div>
    </div>
  );
}
