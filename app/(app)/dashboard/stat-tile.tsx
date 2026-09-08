import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { STATUS_GOOD, STATUS_CRITICAL } from '../status-colors'

export function StatTile({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status?: 'good' | 'critical'
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex items-center gap-1 font-mono text-lg font-semibold tabular-nums text-foreground">
          {status === 'good' && <ArrowUp className="size-4" style={{ color: STATUS_GOOD }} />}
          {status === 'critical' && <ArrowDown className="size-4" style={{ color: STATUS_CRITICAL }} />}
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
