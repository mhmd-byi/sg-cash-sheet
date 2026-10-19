import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/app/(app)/status-badge'
import { KeyNoteEditor } from '@/app/(app)/key-note-editor'
import type { StockSheetDetail } from '@/lib/stock-sheets'

function DiffCell({ actual, expected }: { actual: number; expected: number }) {
  const diff = actual - expected
  return (
    <span className={diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-primary' : 'text-destructive'}>
      {diff > 0 ? '+' : ''}
      {diff}
    </span>
  )
}

export function StockSheetView({ date, detail }: { date: string; detail: StockSheetDetail }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">{date}</h1>

      <KeyNoteEditor date={date} kind="stock" initialValue={detail.keyNote} />

      <Card>
        <CardHeader>
          <CardTitle>Stock Counts</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock items configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Opening Box</TableHead>
                  <TableHead>Opening Pcs</TableHead>
                  <TableHead>Closing Box</TableHead>
                  <TableHead>Closing Pcs</TableHead>
                  <TableHead>Expected Box</TableHead>
                  <TableHead>Expected Pcs</TableHead>
                  <TableHead>Diff Box</TableHead>
                  <TableHead>Diff Pcs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.items.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.openingBox}</TableCell>
                    <TableCell>{item.openingPcs}</TableCell>
                    <TableCell>{item.closingBox}</TableCell>
                    <TableCell>{item.closingPcs}</TableCell>
                    <TableCell>{item.expectedClosingBox}</TableCell>
                    <TableCell>{item.expectedClosingPcs}</TableCell>
                    <TableCell>
                      <DiffCell actual={item.closingBox} expected={item.expectedClosingBox} />
                    </TableCell>
                    <TableCell>
                      <DiffCell actual={item.closingPcs} expected={item.expectedClosingPcs} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
