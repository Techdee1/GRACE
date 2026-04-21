export function formatNaira(kobo) {
  const naira = kobo / 100
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(naira)
}

export function formatNairaShort(kobo) {
  const n = kobo / 100
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
  return `₦${n.toFixed(0)}`
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const PATTERN_LABELS = {
  POS_RING: 'POS Cash-Out Ring',
  SHELL_WEB: 'Shell Director Web',
  LAYERED_CHAIN: 'Layered Transfer Chain',
}

export const RISK_LABELS = { HIGH: 'High Risk', MEDIUM: 'Medium Risk', LOW: 'Low Risk', NONE: 'Unscored' }
