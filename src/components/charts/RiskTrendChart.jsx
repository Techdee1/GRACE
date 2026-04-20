import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { mockRiskTrend } from '@/utils/mockData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p className="text-[#94A3B8] mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export function RiskTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={mockRiskTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="high" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="medium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="low" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
        <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4B5563', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="high" stroke="#EF4444" fill="url(#high)" strokeWidth={2} name="High" />
        <Area type="monotone" dataKey="medium" stroke="#F59E0B" fill="url(#medium)" strokeWidth={2} name="Medium" />
        <Area type="monotone" dataKey="low" stroke="#22C55E" fill="url(#low)" strokeWidth={2} name="Low" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
