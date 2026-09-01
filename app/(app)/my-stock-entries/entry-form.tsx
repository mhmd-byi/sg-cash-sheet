'use client'

import { useActionState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addStockEntry } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import type { StockItemListItem } from '@/lib/stock-items'
import { getTodayDateString, getEarliestEntryDateString } from '@/lib/date'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function EntryForm({
  items,
  particularSuggestions,
}: {
  items: StockItemListItem[]
  particularSuggestions: string[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const particularsRef = useRef<HTMLInputElement>(null)

  const [state, formAction, pending] = useActionState(async (_prevState: unknown, formData: FormData) => {
    const result = await addStockEntry(undefined, formData)
    if (result.success) {
      toast.success('Entry added.')
      formRef.current?.reset()
      particularsRef.current?.focus()
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to add entry.')
    }
    return result
  }, undefined)

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <datalist id="particular-suggestions">
        {particularSuggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_8rem_1fr_1fr_6rem_6rem_1fr]">
        <Field>
          <FieldLabel htmlFor="date">Date</FieldLabel>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={getTodayDateString()}
            min={getEarliestEntryDateString()}
            max={getTodayDateString()}
            required
          />
        </Field>
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
          <FieldLabel htmlFor="particulars">Particulars</FieldLabel>
          <Input
            id="particulars"
            name="particulars"
            list="particular-suggestions"
            ref={particularsRef}
            autoFocus
          />
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
            <option value="grams">Grams</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="remark">Remark</FieldLabel>
          <Input id="remark" name="remark" />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">You can log entries for today or up to 7 days back.</p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Adding…' : 'Add entry'}
      </Button>
    </form>
  )
}
