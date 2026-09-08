'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { X } from 'lucide-react'
import { addEntries } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import { getTodayDateString, getEarliestEntryDateString } from '@/lib/date'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface EntryRow {
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
}

interface EntriesFormValues {
  date: string
  entries: EntryRow[]
}

function emptyEntry(): EntryRow {
  return { type: 'receipt', particular: '', amount: 0, remark: '' }
}

export function EntryForm({ particularSuggestions }: { particularSuggestions: string[] }) {
  const router = useRouter()
  const particularRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    defaultValues: {
      date: getTodayDateString(),
      entries: [emptyEntry()],
    } as EntriesFormValues,
    onSubmit: async ({ value, formApi }) => {
      const result = await addEntries(value)
      if (result.success) {
        toast.success('Entries added.')
        formApi.setFieldValue('entries', [emptyEntry()])
        particularRef.current?.focus()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to add entries.')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'Enter') {
          e.preventDefault()
          form.handleSubmit()
        }
      }}
      className="flex flex-col gap-3"
    >
      <datalist id="particular-suggestions">
        {particularSuggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>

      <form.Field name="date">
        {(field) => (
          <Field className="w-40">
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input
              id="date"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              min={getEarliestEntryDateString()}
              max={getTodayDateString()}
              required
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="entries" mode="array">
        {(field) => (
          <div
            className="flex flex-col gap-3"
            onKeyDown={(e) => {
              const isAddRowShortcut =
                (e.altKey && e.key === 'Enter') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter')
              if (isAddRowShortcut) {
                e.preventDefault()
                e.stopPropagation()
                field.pushValue(emptyEntry())
              }
            }}
          >
            <div className="flex flex-col gap-2">
              {field.state.value.map((_, i) => (
                <div key={i} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[8rem_1fr_8rem_1fr_auto]">
                  <form.Field name={`entries[${i}].type`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Type</FieldLabel>}
                        <select
                          className={selectClassName}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value as 'receipt' | 'payment')}
                        >
                          <option value="receipt">Receipt</option>
                          <option value="payment">Payment</option>
                        </select>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].particular`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Particular</FieldLabel>}
                        <Input
                          ref={i === 0 ? particularRef : undefined}
                          list="particular-suggestions"
                          autoFocus={i === 0}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].amount`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Amount (₹)</FieldLabel>}
                        <NumberFieldInput step="0.01" value={subField.state.value} onChange={subField.handleChange} />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].remark`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Remark</FieldLabel>}
                        <Input value={subField.state.value} onChange={(e) => subField.handleChange(e.target.value)} />
                      </Field>
                    )}
                  </form.Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.removeValue(i)}
                    disabled={field.state.value.length === 1}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.pushValue(emptyEntry())}
              className="self-start"
            >
              Add row
            </Button>
          </div>
        )}
      </form.Field>

      <p className="text-xs text-muted-foreground">
        You can log entries for today or up to 7 days back. Ctrl+Enter saves all rows; Ctrl+Shift+Enter (or Alt+Enter)
        adds a row.
      </p>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? 'Saving…' : 'Save entries'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
