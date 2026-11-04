import Link from 'next/link'
import { getPendingEntries, getCashSheetFigures } from '@/lib/cash-sheets'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { getTodayDateString } from '@/lib/date'
import { formatINR } from '@/lib/currency'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { PaginationControls } from '../pagination-controls'
import { DateJumpForm } from '../date-jump-form'
import { ApprovalsTabs } from './approvals-tabs'
import { CashApprovalsTable } from './cash-approvals-table'

export default async function CashApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const today = getTodayDateString()
  const [{ rows: entries, totalPages }, figures] = await Promise.all([
    getPendingEntries(page, pageSize),
    getCashSheetFigures(today),
  ])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">Approvals</h1>
        <div className="flex flex-wrap items-end gap-2">
          <DateJumpForm basePath="/cash-sheets" />
          <Link href={`/cash-sheets/${getTodayDateString()}`} className={buttonVariants({ variant: 'outline' })}>
            Today&apos;s Cash Sheet
          </Link>
          <ApprovalsTabs current="cash" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-44">
          <FieldLabel htmlFor="openingBalance">Opening Balance</FieldLabel>
          <Input id="openingBalance" readOnly value={formatINR(figures.openingBalance)} />
        </Field>
        <Field className="w-44">
          <FieldLabel htmlFor="cashInHand">Cash in Hand</FieldLabel>
          <Input
            id="cashInHand"
            readOnly
            value={figures.cashInHand == null ? 'Not counted' : formatINR(figures.cashInHand)}
          />
        </Field>
        <p className="pb-2 text-xs text-muted-foreground">As entered by the maker for today ({today})</p>
      </div>
      <CashApprovalsTable data={entries} />
      <PaginationControls basePath="/approvals" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
