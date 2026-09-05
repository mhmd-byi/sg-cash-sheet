import Link from 'next/link'
import { cn } from '@/lib/utils'

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'month', label: 'This month' },
] as const

export function DateRangeTabs({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border p-1">
      {RANGES.map((range) => (
        <Link
          key={range.value}
          href={`/dashboard?range=${range.value}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            current === range.value
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          {range.label}
        </Link>
      ))}
    </div>
  )
}
