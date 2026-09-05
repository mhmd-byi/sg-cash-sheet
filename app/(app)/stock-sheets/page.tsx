import Link from 'next/link'
import { getStockSheetsList } from '@/lib/stock-sheets'
import { getTodayDateString } from '@/lib/date'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DateJumpForm } from '../date-jump-form'

export default async function StockSheetsPage() {
  const sheets = await getStockSheetsList()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-lg font-medium">Stock Sheets</h1>
        <div className="flex items-end gap-2">
          <DateJumpForm basePath="/stock-sheets" />
          <Link href="/stock-sheets/entries" className={buttonVariants({ variant: 'outline' })}>
            All Entries
          </Link>
          <Link href={`/stock-sheets/${getTodayDateString()}`} className={buttonVariants({ variant: 'default' })}>
            Today&apos;s Sheet
          </Link>
        </div>
      </div>
      {sheets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stock sheets recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Transfers Logged</TableHead>
              <TableHead>Saved By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheets.map((sheet) => (
              <TableRow key={sheet.date}>
                <TableCell>
                  <Link href={`/stock-sheets/${sheet.date}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {sheet.date}
                  </Link>
                </TableCell>
                <TableCell>{sheet.transferCount}</TableCell>
                <TableCell>{sheet.updatedByName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
