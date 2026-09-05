import { getAllEntries } from '@/lib/cash-sheets'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { PaginationControls } from '../../pagination-controls'
import { EntriesTable } from './entries-table'

export default async function AllCashEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const { rows: entries, totalPages } = await getAllEntries(page, pageSize)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">All Cash Entries</h1>
      <EntriesTable data={entries} />
      <PaginationControls basePath="/cash-sheets/entries" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
