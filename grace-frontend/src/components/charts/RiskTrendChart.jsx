import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { useAlerts } from '@/hooks/useAlerts'
import { Spinner } from '@/components/ui/Spinner'

const PATTERN_LABELS = {
  pos_cash_out_ring: 'POS Cash-Out Ring',
  shell_director_web: 'Shell Director Web',
  layered_transfer_chain: 'Layered Transfer Chain',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p className="text-[#94A3B8] mb-1">{d.name}</p>
      <p style={{ color: d.fill }}>Risk Score: {d.risk}/100</p>
    </div>
  )
}

export function RiskTrendChart() {
  const { data: alerts, isLoading } = useAlerts()

  if (isLoading) {
    return <div className="flex justify-center items-center h-[200px]"><Spinner /></div>
  }
  if (!alerts?.length) {
    return <div className="flex justify-center items-center h-[200px] text-[#4B5563] text-sm">No alerts detected yet</div>
  }

  const chartData = alerts.map((alert) => ({
    name: PATTERN_LABELS[alert.patternType] ?? alert.patternType,
    risk: Math.round(alert.riskScore * 100),
    fill:
      alert.riskScore >= 0.7
        ? '#ef4444'
        : alert.riskScore >= 0.4
        ? '#f59e0b'
        : '#22c55e',
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: '#4B5563', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={145}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="risk" radius={[0, 3, 3, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
          ))}
          <LabelList
            dataKey="risk"
            position="right"
            style={{ fill: '#94A3B8', fontSize: 11 }}
            formatter={(v) => `${v}`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
