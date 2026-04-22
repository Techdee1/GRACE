import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAlerts } from '@/hooks/useAlerts'
import { useSTRs } from '@/hooks/useSTR'
import { Spinner } from '@/components/ui/Spinner'

const RADIAN = Math.PI / 180

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  if (!value) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#F7F9FC" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {value}
    </text>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p style={{ color: payload[0].payload.fill }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

export function TransactionVolumeChart() {
  const { data: alerts, isLoading: alertsLoading } = useAlerts()
  const { data: strs, isLoading: strsLoading } = useSTRs()

  const isLoading = alertsLoading || strsLoading

  if (isLoading) {
    return <div className="flex justify-center items-center h-[200px]"><Spinner /></div>
  }
  if (!alerts?.length) {
    return <div className="flex justify-center items-center h-[200px] text-[#4B5563] text-sm">No alerts detected yet</div>
  }

  const openCount = (alerts ?? []).filter((a) => a.status === 'OPEN').length
  const strCount = strs?.length ?? 0
  const approvedCount = (strs ?? []).filter((s) => s.decision === 'approved').length
  const total = alerts.length

  const data = [
    { name: 'Open', value: openCount, fill: '#ef4444' },
    { name: 'STR Generated', value: strCount, fill: '#f59e0b' },
    { name: 'Approved', value: approvedCount, fill: '#22c55e' },
  ].filter((d) => d.value > 0)

  return (
    <div className="relative" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="42%"
            cy="50%"
            innerRadius={52}
            outerRadius={76}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconSize={8}
            iconType="circle"
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 11, color: '#4B5563', paddingLeft: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute pointer-events-none flex flex-col items-center justify-center"
        style={{ left: '42%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <span className="text-2xl font-semibold font-mono text-[#F7F9FC] leading-none">{total}</span>
        <span className="text-[10px] text-[#4B5563] mt-0.5">total</span>
      </div>
    </div>
  )
}
