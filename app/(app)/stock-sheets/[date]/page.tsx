import { notFound } from 'next/navigation'
import { getStockSheetByDate, getDistinctParticulars } from '@/lib/stock-sheets'
import { getCurrentUser } from '@/lib/dal'
import { isValidDateString } from '@/lib/date'
import { StockSheetForm } from './stock-sheet-form'
import { StockSheetView } from './stock-sheet-view'

export default async function StockSheetPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  if (!isValidDateString(date)) {
    notFound()
  }

  const [detail, user] = await Promise.all([getStockSheetByDate(date), getCurrentUser()])

  if (user?.role !== 'admin') {
    return <StockSheetView date={date} detail={detail} />
  }

  const particularSuggestions = await getDistinctParticulars()

  return <StockSheetForm date={date} detail={detail} particularSuggestions={particularSuggestions} />
}
