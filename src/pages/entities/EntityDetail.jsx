import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { EntityProfile } from '@/components/entities/EntityProfile'
import { TransactionList } from '@/components/entities/TransactionList'
import { AlertCard } from '@/components/alerts/AlertCard'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { useGraphLayout } from '@/components/graph/useGraphLayout'
import { useEntity } from '@/hooks/useEntities'
import { useAlerts } from '@/hooks/useAlerts'
import { mockTransactions, mockGraphData } from '@/utils/mockData'
import { Spinner } from '@/components/ui/Spinner'

export default function EntityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: entity, isLoading } = useEntity(id)
  const { data: alerts } = useAlerts()

  // Compute 1-hop neighbour IDs using original string IDs (before D3 mutation)
  const hopIds = mockGraphData.links
    .filter((l) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      return src === id || tgt === id
    })
    .flatMap((l) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      return [src, tgt]
    })

  const uniqueHopIds = [...new Set([id, ...hopIds])]
  const { nodes: hopNodes, links: hopLinks } = useGraphLayout('ALL', uniqueHopIds)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!entity) return <div className="text-center py-16 text-[#4B5563]">Entity not found</div>

  const linkedAlerts = alerts?.filter((a) => entity.linkedAlerts.includes(a.id)) ?? []
  const entityTxns = mockTransactions.filter((t) => t.fromEntity === id || t.toEntity === id)

  return (
    <div>
      <PageHeader backTo="/entities" title={entity.canonicalName} subtitle={entity.id} />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <EntityProfile entity={entity} />
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-[#2D3748]">
            <p className="text-xs text-[#4B5563] uppercase tracking-wider">1-Hop Network</p>
          </div>
          <GraphCanvas
            nodes={hopNodes}
            links={hopLinks}
            height={280}
            onNodeClick={(n) => n.id !== id && navigate(`/entities/${n.id}`)}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Transaction History</p>
        <TransactionList transactions={entityTxns.length ? entityTxns : mockTransactions.slice(0, 3)} />
      </div>

      {linkedAlerts.length > 0 && (
        <div>
          <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Linked Alerts</p>
          <div className="space-y-2">
            {linkedAlerts.map((a) => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}
