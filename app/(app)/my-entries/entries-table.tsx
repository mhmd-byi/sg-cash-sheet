import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatINR } from '@/lib/currency'
import { StatusBadge } from '@/app/(app)/status-badge'
import type { MyEntryRow } from '@/lib/cash-sheets'

function EntriesColumn({ title, rows }: { title: string; rows: MyEntryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} on this page.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particular</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.particular}</TableCell>
                  <TableCell>{formatINR(entry.amount)}</TableCell>
                  <TableCell>{entry.remark}</TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function EntriesTable({ data }: { data: MyEntryRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t added any entries yet.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <EntriesColumn title="Receipts" rows={data.filter((entry) => entry.type === 'receipt')} />
      <EntriesColumn title="Payments" rows={data.filter((entry) => entry.type === 'payment')} />
    </div>
  )
}
