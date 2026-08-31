'use client'

import { useActionState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addEntry } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

export function EntryForm() {
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr_8rem_1fr]">
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
          <Input id="particular" name="particular" required />
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
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Adding…' : 'Add entry'}
      </Button>
    </form>
  )
}
