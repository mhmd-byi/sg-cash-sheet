import Link from 'next/link'
import { getPendingEntries } from '@/lib/cash-sheets'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { getTodayDateString } from '@/lib/date'
import { buttonVariants } from '@/components/ui/button'
import { PaginationControls } from '../pagination-controls'
import { DateJumpForm } from '../date-jump-form'
import { ApprovalsTabs } from './approvals-tabs'
import { CashApprovalsTable } from './cash-approvals-table'

export default async function CashApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const { rows: entries, totalPages } = await getPendingEntries(page, pageSize)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">Approvals</h1>
        <div className="flex flex-wrap items-end gap-2">
          <DateJumpForm basePath="/cash-sheets" />
          <Link href={`/cash-sheets/${getTodayDateString()}`} className={buttonVariants({ variant: 'outline' })}>
            Today&apos;s Cash Sheet
          </Link>
          <ApprovalsTabs current="cash" />
        </div>
      </div>
      <CashApprovalsTable data={entries} />
      <PaginationControls basePath="/approvals" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
