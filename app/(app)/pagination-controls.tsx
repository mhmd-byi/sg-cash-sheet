'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination'

export function PaginationControls({
  basePath,
  page,
  pageSize,
  totalPages,
}: {
  basePath: string
  page: number
  pageSize: number
  totalPages: number
}) {
  const router = useRouter()
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Rows per page
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value={pageSize}
          onChange={(e) => router.push(`${basePath}?page=1&pageSize=${e.target.value}`)}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}?page=${page - 1}&pageSize=${pageSize}`}
            aria-disabled={!hasPrev}
            tabIndex={hasPrev ? undefined : -1}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), !hasPrev && 'pointer-events-none opacity-50')}
          >
            Previous
          </Link>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Link
            href={`${basePath}?page=${page + 1}&pageSize=${pageSize}`}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), !hasNext && 'pointer-events-none opacity-50')}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  )
}
