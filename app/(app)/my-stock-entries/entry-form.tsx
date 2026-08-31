'use client'

import { useActionState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addStockEntry } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import type { StockItemListItem } from '@/lib/stock-items'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function EntryForm({ items }: { items: StockItemListItem[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, pending] = useActionState(async (_prevState: unknown, formData: FormData) => {
    const result = await addStockEntry(undefined, formData)
    if (result.success) {
      toast.success('Entry added.')
      formRef.current?.reset()
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to add entry.')
    }
    return result
  }, undefined)

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr_6rem_6rem_1fr]">
        <Field>
          <FieldLabel htmlFor="type">Type</FieldLabel>
          <select id="type" name="type" required className={selectClassName}>
            <option value="receive">Receive</option>
            <option value="issue">Issue</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="itemId">Item</FieldLabel>
          <select id="itemId" name="itemId" required className={selectClassName} defaultValue="">
            <option value="" disabled>
              Select an item
            </option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="qty">Qty</FieldLabel>
          <Input id="qty" name="qty" type="number" step="1" min="1" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="unit">Unit</FieldLabel>
          <select id="unit" name="unit" required className={selectClassName} defaultValue="pcs">
            <option value="pcs">Pcs</option>
            <option value="box">Box</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="remark">Remark</FieldLabel>
          <Input id="remark" name="remark" />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Adding…' : 'Add entry'}
      </Button>
    </form>
  )
}
