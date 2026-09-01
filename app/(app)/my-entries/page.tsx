import { getMyEntries, getDistinctParticulars } from '@/lib/cash-sheets'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EntryForm } from './entry-form'
import { EntriesTable } from './entries-table'

export default async function MyEntriesPage() {
  const [entries, particularSuggestions] = await Promise.all([getMyEntries(), getDistinctParticulars()])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">My Entries</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add an entry for today</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm particularSuggestions={particularSuggestions} />
        </CardContent>
      </Card>
      <EntriesTable data={entries} />
    </div>
  )
}
