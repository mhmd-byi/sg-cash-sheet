import { getAllEntries } from '@/lib/cash-sheets'
import { EntriesTable } from './entries-table'

export default async function AllCashEntriesPage() {
  const entries = await getAllEntries()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">All Cash Entries</h1>
      <EntriesTable data={entries} />
    </div>
  )
}
