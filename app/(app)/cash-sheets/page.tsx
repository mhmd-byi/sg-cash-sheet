import Link from 'next/link'
import { getCashSheetsList } from '@/lib/cash-sheets'
import { getTodayDateString } from '@/lib/date'
import { buttonVariants } from '@/components/ui/button'
import { DateJumpForm } from '../date-jump-form'
import { CashSheetsTable } from './cash-sheets-table'

export default async function CashSheetsPage() {
  const sheets = await getCashSheetsList()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-lg font-medium">Cash Sheets</h1>
        <div className="flex items-end gap-2">
          <DateJumpForm basePath="/cash-sheets" />
          <Link href="/cash-sheets/entries" className={buttonVariants({ variant: 'outline' })}>
            All Entries
          </Link>
          <Link href={`/cash-sheets/${getTodayDateString()}`} className={buttonVariants({ variant: 'default' })}>
            Today&apos;s Sheet
          </Link>
        </div>
      </div>
      <CashSheetsTable data={sheets} />
    </div>
  )
}
