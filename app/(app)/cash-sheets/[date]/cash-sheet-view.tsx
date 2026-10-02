import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatINR } from '@/lib/currency'
import { StatusBadge } from '@/app/(app)/status-badge'
import type { CashSheetDetail, CashSheetRowDTO } from '@/lib/cash-sheets'

function Totals({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={emphasize ? 'text-lg font-semibold' : 'font-medium'}>{formatINR(value)}</span>
    </div>
  )
}

function RowsTable({ rows, title }: { rows: CashSheetRowDTO[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} logged.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Particular</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Entered By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.particular}</TableCell>
                  <TableCell>{formatINR(row.amount)}</TableCell>
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
  )
}

export function CashSheetView({
  date,
  data,
  defaultOpeningBalance,
}: {
  date: string
  data: CashSheetDetail | null
  defaultOpeningBalance: number
}) {
  const openingBalance = data?.openingBalance ?? defaultOpeningBalance
  const totalReceipts = data?.totalReceipts ?? 0
  const totalPayments = data?.totalPayments ?? 0
  const closingBalance = data?.closingBalance ?? openingBalance
  const variance = data?.cashVariance ?? null

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">{date}</h1>
        <Totals label="Opening Balance" value={openingBalance} />
      </div>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <Totals label="Total Receipt" value={totalReceipts} />
          <Totals label="Total Payment" value={totalPayments} />
          <Totals label="Closing Balance" value={closingBalance} emphasize />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Cash Variance</span>
            {variance == null ? (
              <span className="font-medium text-muted-foreground">Not counted</span>
            ) : (
              <span className={`font-medium ${variance < 0 ? 'text-destructive' : 'text-primary'}`}>
                {variance >= 0 ? '+' : ''}
                {formatINR(variance)} {variance >= 0 ? 'excess' : 'short'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <RowsTable rows={data?.receipts ?? []} title="Receipts" />
        <RowsTable rows={data?.payments ?? []} title="Payments" />
      </div>
    </div>
  )
}
