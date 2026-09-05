'use client'

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { CashFlowPoint } from '@/lib/dashboard'

const chartConfig = {
  closingBalance: { label: 'Closing Balance', color: '#2a78d6' },
} satisfies ChartConfig

export function ClosingBalanceChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(5)} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="closingBalance"
          type="monotone"
          stroke="var(--color-closingBalance)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
