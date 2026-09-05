'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { CashFlowPoint } from '@/lib/dashboard'

const chartConfig = {
  totalReceipts: { label: 'Receipts', color: '#2a78d6' },
  totalPayments: { label: 'Payments', color: '#eb6834' },
} satisfies ChartConfig

export function ReceiptsPaymentsChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(5)} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="totalReceipts" fill="var(--color-totalReceipts)" radius={4} />
        <Bar dataKey="totalPayments" fill="var(--color-totalPayments)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
