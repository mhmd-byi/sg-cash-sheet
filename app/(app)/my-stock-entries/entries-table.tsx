import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/app/(app)/status-badge'
import type { MyStockEntryRow } from '@/lib/stock-sheets'

export function EntriesTable({ data }: { data: MyStockEntryRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t logged any stock entries yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Particulars</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry, i) => (
          <TableRow key={i}>
            <TableCell>{entry.date}</TableCell>
            <TableCell className="capitalize">{entry.type}</TableCell>
            <TableCell>{entry.itemName}</TableCell>
            <TableCell>{entry.particulars}</TableCell>
            <TableCell>{entry.qty}</TableCell>
            <TableCell className="capitalize">{entry.unit}</TableCell>
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
