import { getCashFlowSeries, getStockActivitySeries } from '@/lib/dashboard'
import { getTodayDateString, getDateDaysAgo } from '@/lib/date'
import { formatINR } from '@/lib/currency'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DateRangeTabs } from './date-range-tabs'
import { StatTile } from './stat-tile'
import { ReceiptsPaymentsChart } from './receipts-payments-chart'
import { ClosingBalanceChart } from './closing-balance-chart'
import { CashVarianceChart } from './cash-variance-chart'
import { StockActivityChart } from './stock-activity-chart'

function getRangeBounds(range: string) {
  const endDate = getTodayDateString()

  if (range === 'month') {
    return { startDate: `${endDate.slice(0, 7)}-01`, endDate }
  }
  if (range === '7d') return { startDate: getDateDaysAgo(6), endDate }
  if (range === '90d') return { startDate: getDateDaysAgo(89), endDate }
  return { startDate: getDateDaysAgo(29), endDate } // '30d' default
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range = '30d' } = await searchParams
  const { startDate, endDate } = getRangeBounds(range)

  const [cashSeries, stockSeries] = await Promise.all([
    getCashFlowSeries(startDate, endDate),
    getStockActivitySeries(startDate, endDate),
  ])

  const totalReceipts = cashSeries.reduce((sum, p) => sum + p.totalReceipts, 0)
  const totalPayments = cashSeries.reduce((sum, p) => sum + p.totalPayments, 0)
  const netCashFlow = totalReceipts - totalPayments
  const latestClosingBalance = cashSeries.at(-1)?.closingBalance ?? 0
  const countedVariances = cashSeries.map((p) => p.cashVariance).filter((v): v is number => v != null)
  const totalVariance = countedVariances.reduce((sum, v) => sum + v, 0)
  const totalReceived = stockSeries.reduce((sum, p) => sum + p.receiveCount, 0)
  const totalIssued = stockSeries.reduce((sum, p) => sum + p.issueCount, 0)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">Dashboard</h1>
        <DateRangeTabs current={range} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total Receipts" value={formatINR(totalReceipts)} />
        <StatTile label="Total Payments" value={formatINR(totalPayments)} />
        <StatTile
          label="Net Cash Flow"
          value={formatINR(netCashFlow)}
          status={netCashFlow >= 0 ? 'good' : 'critical'}
        />
        <StatTile label="Current Cash Balance" value={formatINR(latestClosingBalance)} />
        <StatTile
          label="Total Cash Variance"
          value={countedVariances.length === 0 ? 'Not counted' : formatINR(totalVariance)}
          status={countedVariances.length === 0 ? undefined : totalVariance >= 0 ? 'good' : 'critical'}
        />
        <StatTile label="Stock Received / Issued" value={`${totalReceived} / ${totalIssued}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receipts vs Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptsPaymentsChart data={cashSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Balance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ClosingBalanceChart data={cashSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Excess / Shortage</CardTitle>
          </CardHeader>
          <CardContent>
            <CashVarianceChart data={cashSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Activity (Received vs Issued)</CardTitle>
          </CardHeader>
          <CardContent>
            <StockActivityChart data={stockSeries} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
