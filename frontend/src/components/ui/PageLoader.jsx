export default function PageLoader() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-52 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-9 bg-gray-100 rounded-lg" style={{ width: `${90 - i * 7}%` }} />
        ))}
      </div>
    </div>
  );
}
