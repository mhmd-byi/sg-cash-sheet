import { notFound } from 'next/navigation'
import { getCashSheetByDate, getDistinctParticulars } from '@/lib/cash-sheets'
import { getCurrentUser } from '@/lib/dal'
import { isValidDateString } from '@/lib/date'
import { CashSheetForm } from './cash-sheet-form'
import { CashSheetView } from './cash-sheet-view'

export default async function CashSheetPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  if (!isValidDateString(date)) {
    notFound()
  }

  const [existing, user] = await Promise.all([getCashSheetByDate(date), getCurrentUser()])

  if (user?.role !== 'admin') {
    return <CashSheetView date={date} data={existing} />
  }

  const particularSuggestions = await getDistinctParticulars()

  return <CashSheetForm date={date} initialData={existing} particularSuggestions={particularSuggestions} />
}
