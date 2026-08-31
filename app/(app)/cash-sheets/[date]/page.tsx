import { notFound } from 'next/navigation'
import { getCashSheetByDate, getPreviousClosingBalance } from '@/lib/cash-sheets'
import { isValidDateString } from '@/lib/date'
import { CashSheetForm } from './cash-sheet-form'

export default async function CashSheetPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  if (!isValidDateString(date)) {
    notFound()
  }

  const existing = await getCashSheetByDate(date)
  const openingBalance = existing ? existing.openingBalance : (await getPreviousClosingBalance(date)) ?? 0

  return <CashSheetForm date={date} initialData={existing} defaultOpeningBalance={openingBalance} />
}
