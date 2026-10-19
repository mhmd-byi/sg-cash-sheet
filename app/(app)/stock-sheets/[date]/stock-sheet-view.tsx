import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/app/(app)/status-badge'
import { KeyNoteEditor } from '@/app/(app)/key-note-editor'
import type { StockSheetDetail } from '@/lib/stock-sheets'

function RowHeader({ labels }: { labels: string[] }) {
  return (
    <>
      {labels.map((label) => (
        <span key={label} className="text-sm font-medium">
          {label}
        </span>
      ))}
    </>
  )
}

export function StockSheetView({ date, detail }: { date: string; detail: StockSheetDetail }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">{date}</h1>

      <KeyNoteEditor date={date} kind="stock" initialValue={detail.keyNote} />

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Opening Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {detail.items.map((item, i) => (
              <div key={item.itemId} className="grid grid-cols-[1fr_5rem_5rem_1fr] items-end gap-2">
                {i === 0 && <RowHeader labels={['Item', 'Box', 'Pcs', 'Remark']} />}
                <span className="flex items-center text-sm">{item.itemName}</span>
                <span className="flex items-center text-sm">{item.openingBox}</span>
                <span className="flex items-center text-sm">{item.openingPcs}</span>
                <span className="flex items-center truncate text-sm text-muted-foreground">{item.openingRemark || '—'}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {detail.items.map((item, i) => (
              <div key={item.itemId} className="grid grid-cols-[1fr_5rem_5rem_1fr] items-end gap-2">
                {i === 0 && <RowHeader labels={['Item', 'Box', 'Pcs', 'Remark']} />}
                <span className="flex items-center text-sm">{item.itemName}</span>
                <ClosingCell actual={item.closingBox} expected={item.expectedClosingBox} />
                <ClosingCell actual={item.closingPcs} expected={item.expectedClosingPcs} />
                <span className="flex items-center truncate text-sm text-muted-foreground">{item.closingRemark || '—'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Display Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {detail.items.map((item, i) => (
            <div key={item.itemId} className="grid grid-cols-[1fr_5rem_1fr] items-end gap-2">
              {i === 0 && <RowHeader labels={['Item', 'Pcs', 'Remark']} />}
              <span className="flex items-center text-sm">{item.itemName}</span>
              <span className="flex items-center text-sm">{item.displayPcs}</span>
              <span className="flex items-center truncate text-sm text-muted-foreground">{item.displayRemark || '—'}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfers (Receive / Issue)</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transfers logged.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Entered By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.transfers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="capitalize">{row.type}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell>{row.particulars}</TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell className="capitalize">{row.unit}</TableCell>
                    <TableCell>{row.remark}</TableCell>
                    <TableCell>{row.enteredByName}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ClosingCell({ actual, expected }: { actual: number; expected: number }) {
  const diff = actual - expected
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center text-sm">{actual}</span>
      <span className={`text-xs ${diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-primary' : 'text-destructive'}`}>
        expected {expected}
        {diff !== 0 && ` (${diff > 0 ? '+' : ''}${diff})`}
      </span>
    </div>
  )
}
