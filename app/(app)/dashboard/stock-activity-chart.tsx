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
import type { StockActivityPoint } from '@/lib/dashboard'

const chartConfig = {
  receiveCount: { label: 'Received', color: '#2a78d6' },
  issueCount: { label: 'Issued', color: '#eb6834' },
} satisfies ChartConfig

export function StockActivityChart({ data }: { data: StockActivityPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(5)} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="receiveCount" fill="var(--color-receiveCount)" radius={4} />
        <Bar dataKey="issueCount" fill="var(--color-issueCount)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
