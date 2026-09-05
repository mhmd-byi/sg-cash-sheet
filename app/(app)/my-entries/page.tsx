import { getMyEntries, getDistinctParticulars } from '@/lib/cash-sheets'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PaginationControls } from '../pagination-controls'
import { EntryForm } from './entry-form'
import { EntriesTable } from './entries-table'

export default async function MyEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const [{ rows: entries, totalPages }, particularSuggestions] = await Promise.all([
    getMyEntries(page, pageSize),
    getDistinctParticulars(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">My Entries</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add entries</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm particularSuggestions={particularSuggestions} />
        </CardContent>
      </Card>
      <EntriesTable data={entries} />
      <PaginationControls basePath="/my-entries" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
