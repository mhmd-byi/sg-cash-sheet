import 'server-only'
import { requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { getDateRange } from '@/lib/date'
import { CashSheet } from '@/models/CashSheet'
import { StockSheet } from '@/models/StockSheet'

export interface CashFlowPoint {
  date: string
  openingBalance: number
  totalReceipts: number
  totalPayments: number
  closingBalance: number
  actualClosingCash: number | null
  cashVariance: number | null
}

export async function getCashFlowSeries(startDate: string, endDate: string): Promise<CashFlowPoint[]> {
  await requireAdmin()
  await connectDB()

  const sheets = await CashSheet.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 })
  const byDate = new Map(sheets.map((sheet) => [sheet.date, sheet]))

  return getDateRange(startDate, endDate).map((date) => {
    const sheet = byDate.get(date)
    return {
      date,
      openingBalance: sheet?.openingBalance ?? 0,
      totalReceipts: sheet?.totalReceipts ?? 0,
      totalPayments: sheet?.totalPayments ?? 0,
      closingBalance: sheet?.closingBalance ?? 0,
      actualClosingCash: sheet?.actualClosingCash ?? null,
      cashVariance: sheet?.cashVariance ?? null,
    }
  })
}

export interface StockActivityPoint {
  date: string
  receiveCount: number
  issueCount: number
}

interface StockActivityAggregate {
  _id: { date: string; type: 'receive' | 'issue' }
  count: number
}

export async function getStockActivitySeries(startDate: string, endDate: string): Promise<StockActivityPoint[]> {
  await requireAdmin()
  await connectDB()

  const rows = await StockSheet.aggregate<StockActivityAggregate>([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    { $unwind: '$transfers' },
    { $group: { _id: { date: '$date', type: '$transfers.type' }, count: { $sum: 1 } } },
  ])

  const receiveByDate = new Map<string, number>()
  const issueByDate = new Map<string, number>()
  for (const row of rows) {
    const target = row._id.type === 'receive' ? receiveByDate : issueByDate
    target.set(row._id.date, row.count)
  }

  return getDateRange(startDate, endDate).map((date) => ({
    date,
    receiveCount: receiveByDate.get(date) ?? 0,
    issueCount: issueByDate.get(date) ?? 0,
  }))
}
