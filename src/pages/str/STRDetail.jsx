import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { STREditor } from '@/components/str/STREditor'
import { STRPreview } from '@/components/str/STRPreview'
import { AuditTrail } from '@/components/str/AuditTrail'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSTR } from '@/hooks/useSTR'
import { toast } from '@/store/toastStore'
import { Spinner } from '@/components/ui/Spinner'

export default function STRDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: str, isLoading } = useSTR(id)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approved, setApproved] = useState(false)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!str) return <div className="text-center py-16 text-[#4B5563]">STR not found</div>

  const handleApprove = () => {
    setApproved(true)
    setApproveModal(false)
    toast.success(`${str.id} filed successfully with NFIU`)
  }

  const handleReject = () => {
    setRejectModal(false)
    toast.error(`${str.id} rejected`)
    navigate('/str')
  }

  return (
    <div>
      <PageHeader backTo="/str" title={`STR ${str.id}`} subtitle={`Alert: ${str.alertId}`} />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="space-y-4">
          <STRPreview str={approved ? { ...str, status: 'FILED' } : str} />
          <AuditTrail strId={str.id} />
        </div>
        <div className="lg:col-span-2">
          <STREditor content={str.draftContent} readOnly={str.status === 'FILED' || approved} />
        </div>
      </div>

      {!approved && str.status !== 'FILED' ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setApproveModal(true)}>Approve & File</Button>
          <Button variant="secondary" onClick={() => toast.info('Changes requested — awaiting revision')}>Request Changes</Button>
          <Button variant="danger" onClick={() => setRejectModal(true)}>Reject</Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="text-green-400 text-sm font-medium">✓ STR filed successfully with NFIU</span>
          <button onClick={() => navigate('/str')} className="ml-auto text-xs text-[#94A3B8] hover:text-[#F7F9FC]">Back to STRs →</button>
        </div>
      )}

      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Approve & File STR">
        <p className="text-sm text-[#94A3B8] mb-4">
          You are about to file <strong className="text-[#F7F9FC]">{str.id}</strong> with the NFIU. This action is irreversible and will be recorded in the audit trail.
        </p>
        <div className="bg-[#1C2333] border border-[#2D3748] rounded-md p-3 mb-4">
          <p className="text-[10px] text-[#4B5563] font-mono break-all">Payload Hash: {str.payloadHash}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setApproveModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleApprove}>Confirm & File</Button>
        </div>
      </Modal>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject STR">
        <p className="text-sm text-[#94A3B8] mb-4">Provide a reason for rejecting this STR draft.</p>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Rejection reason..."
          className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md p-3 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setRejectModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReject}>Reject STR</Button>
        </div>
      </Modal>
    </div>
  )
}
