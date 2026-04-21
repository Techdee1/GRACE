import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { AlertTimeline } from '@/components/alerts/AlertTimeline'
import { TransactionList } from '@/components/entities/TransactionList'
import { EntityCard } from '@/components/entities/EntityCard'
import { useGraphLayout } from '@/components/graph/useGraphLayout'
import { useAlert } from '@/hooks/useAlerts'
import { useEntities } from '@/hooks/useEntities'
import { toast } from '@/store/toastStore'
import { mockTransactions } from '@/utils/mockData'
import { PATTERN_LABELS, formatDateTime, formatNairaShort } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: alert, isLoading } = useAlert(id)
  const { data: entities } = useEntities()
  const [noteModal, setNoteModal] = useState(false)
  const [dismissModal, setDismissModal] = useState(false)
  const [note, setNote] = useState('')

  const entityIds = alert?.entityIds ?? []
  const { nodes: subNodes, links: subLinks } = useGraphLayout('ALL', entityIds.length ? entityIds : null)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!alert) return <div className="text-center py-16 text-[#4B5563]">Alert not found</div>

  const linkedEntities = entities?.filter((e) => alert.entityIds.includes(e.id)) ?? []

  const handleSaveNote = () => {
    setNoteModal(false)
    setNote('')
    toast.success('Investigation note saved')
  }

  const handleDismiss = () => {
    setDismissModal(false)
    toast.info(`Alert ${alert.id} dismissed`)
    navigate('/alerts')
  }

  return (
    <div>
      <PageHeader
        backTo="/alerts"
        title={`Alert ${alert.id}`}
        subtitle={`Detected ${formatDateTime(alert.detectedAt)} UTC`}
        actions={
          <div className="flex items-center gap-2">
            <RiskBadge level={alert.riskLevel} />
            <StatusBadge status={alert.status} />
          </div>
        }
      />

      {/* Pattern + Score */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#F7F9FC]">{PATTERN_LABELS[alert.patternType]}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{alert.entityCount} entities · {formatNairaShort(alert.totalVolume)} total volume</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-red-400">{(alert.riskScore * 100).toFixed(0)}%</p>
          <p className="text-xs text-[#4B5563]">Risk Score</p>
        </div>
      </div>

      {/* Graph + Entities */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-[#2D3748]">
            <p className="text-xs text-[#4B5563] uppercase tracking-wider">Subgraph Visualization</p>
          </div>
          <GraphCanvas
            nodes={subNodes}
            links={subLinks}
            height={300}
            onNodeClick={(n) => navigate(`/entities/${n.id}`)}
          />
        </div>

        <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Involved Entities</p>
          <div className="space-y-2 overflow-y-auto max-h-72">
            {linkedEntities.length ? linkedEntities.map((e) => <EntityCard key={e.id} entity={e} />) : (
              <p className="text-xs text-[#4B5563]">No entity details available</p>
            )}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mb-4">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Transaction Evidence</p>
        <TransactionList transactions={mockTransactions} />
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <AlertTimeline alert={alert} />
      </div>

      {/* Evidence Hash */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-3 mb-4">
        <p className="text-[10px] text-[#4B5563] uppercase tracking-wider mb-1">Evidence Hash (SHA-256)</p>
        <p className="text-xs text-[#4B5563] font-mono">{alert.evidenceHash}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => { toast.success('Navigating to STR editor'); navigate('/str/STR-001') }}>
          Generate STR
        </Button>
        <Button variant="secondary" onClick={() => setNoteModal(true)}>
          Add Note
        </Button>
        <Button variant="danger" onClick={() => setDismissModal(true)}>
          Dismiss Alert
        </Button>
      </div>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add Investigation Note">
        <div className="space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your investigation notes..."
            rows={4}
            className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md p-3 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setNoteModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveNote}>Save Note</Button>
          </div>
        </div>
      </Modal>

      <Modal open={dismissModal} onClose={() => setDismissModal(false)} title="Dismiss Alert">
        <p className="text-sm text-[#94A3B8] mb-4">Are you sure you want to dismiss alert {alert.id}? This action will be logged in the audit trail.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDismissModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDismiss}>Confirm Dismiss</Button>
        </div>
      </Modal>
    </div>
  )
}
