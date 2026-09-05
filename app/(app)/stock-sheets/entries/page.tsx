import { getAllStockEntries } from '@/lib/stock-sheets'
import { getStockItemsList } from '@/lib/stock-items'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { PaginationControls } from '../../pagination-controls'
import { EntriesTable } from './entries-table'

export default async function AllStockEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const [{ rows: entries, totalPages }, items] = await Promise.all([
    getAllStockEntries(page, pageSize),
    getStockItemsList(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">All Stock Entries</h1>
      <EntriesTable data={entries} items={items} />
      <PaginationControls basePath="/stock-sheets/entries" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
