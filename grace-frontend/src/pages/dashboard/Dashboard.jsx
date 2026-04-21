import { useNavigate } from 'react-router-dom'
import { MetricCard } from '@/components/ui/MetricCard'
import { RiskTrendChart } from '@/components/charts/RiskTrendChart'
import { TransactionVolumeChart } from '@/components/charts/TransactionVolumeChart'
import { AlertCard } from '@/components/alerts/AlertCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAlerts } from '@/hooks/useAlerts'
import { useEntities } from '@/hooks/useEntities'
import { useSTRs } from '@/hooks/useSTR'
import { Spinner } from '@/components/ui/Spinner'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: alerts, isLoading: alertsLoading } = useAlerts()
  const { data: entities } = useEntities()
  const { data: strs } = useSTRs()

  const openAlerts = alerts?.filter((a) => a.status === 'OPEN').length ?? 0
  const highRiskAlerts = alerts?.filter((a) => a.riskLevel === 'HIGH').length ?? 0
  const totalAlerts = alerts?.length ?? 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Compliance overview · Live"
        actions={
          <button
            onClick={() => navigate('/graph')}
            className="px-4 py-2 text-sm bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] rounded-md hover:bg-[#00D4AA]/20 transition-colors font-medium"
          >
            Open Graph Explorer →
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Entities" value={entities?.length ?? '—'} delta="12 new" deltaPositive={false} accent="accent" />
        <MetricCard label="Open Alerts" value={openAlerts} delta="3 new" deltaPositive={false} accent="high" />
        <MetricCard label="STR Reports" value={strs?.length ?? '—'} delta="1 filed" deltaPositive={true} accent="low" />
        <MetricCard label="High Risk" value={highRiskAlerts} accent="high" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium mb-4">Risk Trend — 7 Days</p>
          <RiskTrendChart />
        </div>
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium mb-4">Transaction Volume (₦M)</p>
          <TransactionVolumeChart />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Recent Alerts</p>
          <button onClick={() => navigate('/alerts')} className="text-xs text-[#00D4AA] hover:underline">View all →</button>
        </div>
        {alertsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-2">
            {alerts?.slice(0, 5).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        )}
      </div>
    </div>
  )
}
