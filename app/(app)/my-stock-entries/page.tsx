import { getMyStockEntries, getDistinctParticulars } from '@/lib/stock-sheets'
import { getStockItemsList } from '@/lib/stock-items'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EntryForm } from './entry-form'
import { EntriesTable } from './entries-table'

export default async function MyStockEntriesPage() {
  const [entries, items, particularSuggestions] = await Promise.all([
    getMyStockEntries(),
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
    </div>
  )
}
