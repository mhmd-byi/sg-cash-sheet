import { getPendingEntries } from '@/lib/cash-sheets'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { PaginationControls } from '../pagination-controls'
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
        <ApprovalsTabs current="cash" />
      </div>
      <CashApprovalsTable data={entries} />
      <PaginationControls basePath="/approvals" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
