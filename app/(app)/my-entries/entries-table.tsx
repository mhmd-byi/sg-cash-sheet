import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatINR } from '@/lib/currency'
import { StatusBadge } from '@/app/(app)/status-badge'
import type { MyEntryRow } from '@/lib/cash-sheets'

export function EntriesTable({ data }: { data: MyEntryRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t added any entries yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Particular</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry, i) => (
          <TableRow key={i}>
            <TableCell>{entry.date}</TableCell>
            <TableCell className="capitalize">{entry.type}</TableCell>
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
  )
}
