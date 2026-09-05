import { getAllStockEntries } from '@/lib/stock-sheets'
import { getStockItemsList } from '@/lib/stock-items'
import { EntriesTable } from './entries-table'

export default async function AllStockEntriesPage() {
  const [entries, items] = await Promise.all([getAllStockEntries(), getStockItemsList()])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">All Stock Entries</h1>
      <EntriesTable data={entries} items={items} />
    </div>
  )
}
