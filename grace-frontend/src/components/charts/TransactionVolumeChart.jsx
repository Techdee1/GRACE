import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockVolumeData } from '@/utils/mockData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p className="text-[#94A3B8] mb-1">{label}</p>
      <p className="text-[#00D4AA]">₦{payload[0].value}M</p>
    </div>
  )
}

export function TransactionVolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={mockVolumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4B5563', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="volume" fill="#00D4AA" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
