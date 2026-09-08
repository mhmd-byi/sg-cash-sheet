import { getPendingStockEntries } from '@/lib/stock-sheets'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { PaginationControls } from '../../pagination-controls'
import { ApprovalsTabs } from '../approvals-tabs'
import { StockApprovalsTable } from './stock-approvals-table'

export default async function StockApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const { rows: entries, totalPages } = await getPendingStockEntries(page, pageSize)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">Approvals</h1>
        <ApprovalsTabs current="stock" />
      </div>
      <StockApprovalsTable data={entries} />
      <PaginationControls basePath="/approvals/stock" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
