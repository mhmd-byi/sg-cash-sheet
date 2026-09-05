'use client'

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { CashFlowPoint } from '@/lib/dashboard'

const EXCESS_COLOR = '#2a78d6'
const SHORTAGE_COLOR = '#e34948'

const chartConfig = {
  cashVariance: { label: 'Cash Variance' },
} satisfies ChartConfig

export function CashVarianceChart({ data }: { data: CashFlowPoint[] }) {
  const counted = data.filter((point) => point.cashVariance != null)

  if (counted.length === 0) {
    return (
      <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        No cash counts recorded yet in this range.
      </p>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart data={counted}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(5)} />
        <ReferenceLine y={0} stroke="#c3c2b7" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="cashVariance" radius={4}>
          {counted.map((point) => (
            <Cell key={point.date} fill={(point.cashVariance ?? 0) >= 0 ? EXCESS_COLOR : SHORTAGE_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
