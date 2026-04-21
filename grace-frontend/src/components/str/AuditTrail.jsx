import { formatDateTime } from '@/utils/formatters'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

const auditEntries = [
  { action: 'STR_GENERATED', user: 'GRACE AI · llama-3.3-70b', time: '2026-04-14T10:00:00Z', hash: 'a3f9c2d1e8b7...' },
  { action: 'STR_VIEWED', user: 'Akeem Jr.', time: '2026-04-14T10:05:00Z', hash: 'b4e0d3c2f9a8...' },
]

export function AuditTrail({ strId, entries = auditEntries }) {
  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-[#1C2333] border-b border-[#2D3748]">
        <span className="text-xs text-[#4B5563] uppercase tracking-wider">Audit Trail</span>
      </div>
      <div className="divide-y divide-[#2D3748]">
        {entries.map((entry, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <CheckCircleIcon className="w-4 h-4 text-[#00D4AA] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#F7F9FC] font-mono">{entry.action}</span>
                <span className="text-[10px] text-[#4B5563] shrink-0">{formatDateTime(entry.time)}</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">{entry.user}</p>
              <p className="text-[10px] text-[#4B5563] font-mono mt-0.5">SHA-256: {entry.hash}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
