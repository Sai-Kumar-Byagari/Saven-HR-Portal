import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-medium text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AttendanceBarChart({ data, title = 'Weekly Attendance' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
        <p className="text-sm font-semibold text-gray-800 mb-4">{title}</p>
        <div className="flex items-center justify-center h-36 text-gray-300 text-[13px]">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
      <p className="text-sm font-semibold text-gray-800 mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={10} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            iconType="circle" iconSize={8}
          />
          <Bar dataKey="present"  name="Present"  fill="#22c55e" radius={[3,3,0,0]} />
          <Bar dataKey="absent"   name="Absent"   fill="#ef4444" radius={[3,3,0,0]} />
          <Bar dataKey="on_leave" name="On Leave" fill="#60a5fa" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
