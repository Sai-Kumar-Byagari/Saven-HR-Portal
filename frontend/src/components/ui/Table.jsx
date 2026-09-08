import Spinner from './Spinner';

export default function Table({ columns, data, loading, error, emptyMessage = 'No data found.' }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-medium text-red-500">Failed to load data</p>
        <p className="text-xs text-gray-400 mt-1">{error?.message || 'Please try again.'}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th key={col.key}
                className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={row.id || ri} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
