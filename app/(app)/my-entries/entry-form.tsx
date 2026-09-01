'use client'

import { useActionState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addEntry } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { getTodayDateString, getEarliestEntryDateString } from '@/lib/date'

export function EntryForm({ particularSuggestions }: { particularSuggestions: string[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, pending] = useActionState(async (_prevState: unknown, formData: FormData) => {
    const result = await addEntry(undefined, formData)
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
      <datalist id="particular-suggestions">
        {particularSuggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_8rem_1fr_8rem_1fr]">
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
          <select
            id="type"
            name="type"
            required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="receipt">Receipt</option>
            <option value="payment">Payment</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="particular">Particular</FieldLabel>
          <Input id="particular" name="particular" list="particular-suggestions" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="amount">Amount (₹)</FieldLabel>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
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
