import { notFound } from 'next/navigation'
import { getStockSheetByDate } from '@/lib/stock-sheets'
import { isValidDateString } from '@/lib/date'
import { StockSheetForm } from './stock-sheet-form'

export default async function StockSheetPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  if (!isValidDateString(date)) {
    notFound()
  }

  const detail = await getStockSheetByDate(date)

  return <StockSheetForm date={date} detail={detail} />
}
