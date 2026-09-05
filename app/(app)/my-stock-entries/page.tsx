import { getMyStockEntries, getDistinctParticulars } from '@/lib/stock-sheets'
import { getStockItemsList } from '@/lib/stock-items'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PaginationControls } from '../pagination-controls'
import { EntryForm } from './entry-form'
import { EntriesTable } from './entries-table'

export default async function MyStockEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const [{ rows: entries, totalPages }, items, particularSuggestions] = await Promise.all([
    getMyStockEntries(page, pageSize),
    getStockItemsList(),
    getDistinctParticulars(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">My Stock Entries</h1>
      <Card>
        <CardHeader>
          <CardTitle>Log receive / issue entries</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm items={items} particularSuggestions={particularSuggestions} />
        </CardContent>
      </Card>
      <EntriesTable data={entries} />
      <PaginationControls basePath="/my-stock-entries" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
