import Link from 'next/link'
import { cn } from '@/lib/utils'

export function ApprovalsTabs({ current }: { current: 'cash' | 'stock' }) {
  const tabs = [
    { value: 'cash', label: 'Cash Approvals', href: '/approvals' },
    { value: 'stock', label: 'Stock Approvals', href: '/approvals/stock' },
  ] as const

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            current === tab.value
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
