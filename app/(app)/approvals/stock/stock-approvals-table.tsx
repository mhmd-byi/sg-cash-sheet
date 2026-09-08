'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { approveStockEntry, rejectStockEntry } from '../actions'
import type { PendingStockEntryRow } from '@/lib/stock-sheets'

export function StockApprovalsTable({ data }: { data: PendingStockEntryRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No stock entries waiting for approval.</p>
  }

  function handleApprove(row: PendingStockEntryRow) {
    startTransition(async () => {
      const result = await approveStockEntry(row.date, row.id)
      if (result.success) {
        toast.success('Entry approved.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to approve entry.')
      }
    })
  }

  function handleReject(row: PendingStockEntryRow) {
    startTransition(async () => {
      const result = await rejectStockEntry(row.date, row.id)
      if (result.success) {
        toast.success('Entry rejected.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to reject entry.')
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Particulars</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Maker</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link href={`/stock-sheets/${row.date}`} className="text-primary underline-offset-4 hover:underline">
                {row.date}
              </Link>
            </TableCell>
            <TableCell className="capitalize">{row.type}</TableCell>
            <TableCell>{row.itemName}</TableCell>
            <TableCell>{row.particulars}</TableCell>
            <TableCell>{row.qty}</TableCell>
            <TableCell className="capitalize">{row.unit}</TableCell>
            <TableCell>{row.remark}</TableCell>
            <TableCell>{row.enteredByName}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => handleApprove(row)} disabled={isPending}>
                  Approve
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => handleReject(row)} disabled={isPending}>
                  Reject
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
