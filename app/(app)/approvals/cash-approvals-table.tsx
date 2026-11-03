'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/currency'
import { approveCashEntry, rejectCashEntry } from './actions'
import type { PendingEntryRow } from '@/lib/cash-sheets'

export function CashApprovalsTable({ data }: { data: PendingEntryRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No cash entries waiting for approval.</p>
  }

  function handleApprove(row: PendingEntryRow) {
    startTransition(async () => {
      const result = await approveCashEntry(row.date, row.id)
      if (result.success) {
        toast.success('Entry approved.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to approve entry.')
      }
    })
  }

  function handleReject(row: PendingEntryRow) {
    startTransition(async () => {
      const result = await rejectCashEntry(row.date, row.id)
      if (result.success) {
        toast.success('Entry rejected.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to reject entry.')
      }
    })
  }

  function renderColumn(title: string, rows: PendingEntryRow[]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} waiting on this page.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Particular</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Maker</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/cash-sheets/${row.date}`} className="text-primary underline-offset-4 hover:underline">
                        {row.date}
                      </Link>
                    </TableCell>
                    <TableCell>{row.particular}</TableCell>
                    <TableCell>{formatINR(row.amount)}</TableCell>
                    <TableCell>{row.remark}</TableCell>
                    <TableCell>{row.enteredByName}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => handleApprove(row)} disabled={isPending}>
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(row)}
                          disabled={isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {renderColumn('Receipts', data.filter((row) => row.type === 'receipt'))}
      {renderColumn('Payments', data.filter((row) => row.type === 'payment'))}
    </div>
  )
}
