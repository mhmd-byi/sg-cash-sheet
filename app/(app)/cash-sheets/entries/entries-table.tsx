'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import { formatINR } from '@/lib/currency'
import { updateEntry, deleteEntry } from './actions'
import type { AllEntryRow } from '@/lib/cash-sheets'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface Draft {
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
}

export function EntriesTable({ data }: { data: AllEntryRow[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [isPending, startTransition] = useTransition()

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No entries recorded yet.</p>
  }

  function startEdit(row: AllEntryRow) {
    setEditingId(row.id)
    setDraft({ type: row.type, particular: row.particular, amount: row.amount, remark: row.remark })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(null)
  }

  function saveEdit(row: AllEntryRow) {
    if (!draft) return
    startTransition(async () => {
      const result = await updateEntry(row.date, row.id, draft)
      if (result.success) {
        toast.success('Entry updated.')
        cancelEdit()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update entry.')
      }
    })
  }

  function handleDelete(row: AllEntryRow) {
    if (!confirm(`Delete this ${row.type}? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteEntry(row.date, row.id)
      if (result.success) {
        toast.success('Entry deleted.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete entry.')
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Particular</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Entered By</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const isEditing = editingId === row.id

          return (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/cash-sheets/${row.date}`} className="text-primary underline-offset-4 hover:underline">
                  {row.date}
                </Link>
              </TableCell>
              <TableCell className="capitalize">
                {isEditing && draft ? (
                  <select
                    className={selectClassName}
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as 'receipt' | 'payment' })}
                  >
                    <option value="receipt">Receipt</option>
                    <option value="payment">Payment</option>
                  </select>
                ) : (
                  row.type
                )}
              </TableCell>
              <TableCell>
                {isEditing && draft ? (
                  <Input value={draft.particular} onChange={(e) => setDraft({ ...draft, particular: e.target.value })} />
                ) : (
                  row.particular
                )}
              </TableCell>
              <TableCell>
                {isEditing && draft ? (
                  <NumberFieldInput
                    step="0.01"
                    value={draft.amount}
                    onChange={(value) => setDraft({ ...draft, amount: value })}
                  />
                ) : (
                  formatINR(row.amount)
                )}
              </TableCell>
              <TableCell>
                {isEditing && draft ? (
                  <Input value={draft.remark} onChange={(e) => setDraft({ ...draft, remark: e.target.value })} />
                ) : (
                  row.remark
                )}
              </TableCell>
              <TableCell>{row.enteredByName}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button type="button" size="sm" onClick={() => saveEdit(row)} disabled={isPending}>
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={isPending}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(row)} disabled={isPending}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
