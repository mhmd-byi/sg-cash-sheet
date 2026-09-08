'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import { StatusBadge } from '@/app/(app)/status-badge'
import { updateStockEntry, deleteStockEntry } from './actions'
import type { AllStockEntryRow } from '@/lib/stock-sheets'
import type { StockItemListItem } from '@/lib/stock-items'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface Draft {
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
}

export function EntriesTable({ data, items }: { data: AllStockEntryRow[]; items: StockItemListItem[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [isPending, startTransition] = useTransition()

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No stock entries recorded yet.</p>
  }

  function startEdit(row: AllStockEntryRow) {
    setEditingId(row.id)
    setDraft({ type: row.type, itemId: row.itemId, particulars: row.particulars, qty: row.qty, unit: row.unit, remark: row.remark })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(null)
  }

  function saveEdit(row: AllStockEntryRow) {
    if (!draft) return
    startTransition(async () => {
      const result = await updateStockEntry(row.date, row.id, draft)
      if (result.success) {
        toast.success('Entry updated.')
        cancelEdit()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update entry.')
      }
    })
  }

  function handleDelete(row: AllStockEntryRow) {
    if (!confirm(`Delete this ${row.type}? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteStockEntry(row.date, row.id)
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
          <TableHead>Item</TableHead>
          <TableHead>Particulars</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Entered By</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const isEditing = editingId === row.id

          return (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/stock-sheets/${row.date}`} className="text-primary underline-offset-4 hover:underline">
                  {row.date}
                </Link>
              </TableCell>
              <TableCell className="capitalize">
                {isEditing && draft ? (
                  <select
                    className={selectClassName}
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as 'receive' | 'issue' })}
                  >
                    <option value="receive">Receive</option>
                    <option value="issue">Issue</option>
                  </select>
                ) : (
                  row.type
                )}
              </TableCell>
              <TableCell>
                {isEditing && draft ? (
                  <select
                    className={selectClassName}
                    value={draft.itemId}
                    onChange={(e) => setDraft({ ...draft, itemId: e.target.value })}
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  row.itemName
                )}
              </TableCell>
              <TableCell>
                {isEditing && draft ? (
                  <Input value={draft.particulars} onChange={(e) => setDraft({ ...draft, particulars: e.target.value })} />
                ) : (
                  row.particulars
                )}
              </TableCell>
              <TableCell>
                {isEditing && draft ? (
                  <NumberFieldInput value={draft.qty} onChange={(value) => setDraft({ ...draft, qty: value })} />
                ) : (
                  row.qty
                )}
              </TableCell>
              <TableCell className="capitalize">
                {isEditing && draft ? (
                  <select
                    className={selectClassName}
                    value={draft.unit}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value as 'box' | 'pcs' | 'grams' })}
                  >
                    <option value="pcs">Pcs</option>
                    <option value="box">Box</option>
                    <option value="grams">Grams</option>
                  </select>
                ) : (
                  row.unit
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
                <StatusBadge status={row.status} />
              </TableCell>
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
