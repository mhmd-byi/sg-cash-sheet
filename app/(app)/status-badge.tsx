import { STATUS_GOOD, STATUS_WARNING, STATUS_CRITICAL } from './status-colors'

const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
} as const

const COLORS = {
  pending: STATUS_WARNING,
  approved: STATUS_GOOD,
  rejected: STATUS_CRITICAL,
} as const

export function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS[status] }}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: COLORS[status] }} />
      {LABELS[status]}
    </span>
  )
}
