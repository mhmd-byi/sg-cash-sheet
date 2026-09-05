'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { addStockEntries } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import type { StockItemListItem } from '@/lib/stock-items'
import { getTodayDateString, getEarliestEntryDateString } from '@/lib/date'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface StockEntryRow {
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
}

interface StockEntriesFormValues {
  date: string
  entries: StockEntryRow[]
}

function emptyEntry(): StockEntryRow {
  return { type: 'receive', itemId: '', particulars: '', qty: 0, unit: 'pcs', remark: '' }
}

export function EntryForm({
  items,
  particularSuggestions,
}: {
  items: StockItemListItem[]
  particularSuggestions: string[]
}) {
  const router = useRouter()
  const particularsRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    defaultValues: {
      date: getTodayDateString(),
      entries: [emptyEntry()],
    } as StockEntriesFormValues,
    onSubmit: async ({ value, formApi }) => {
      const result = await addStockEntries(value)
      if (result.success) {
        toast.success('Entries added.')
        formApi.setFieldValue('entries', [emptyEntry()])
        particularsRef.current?.focus()
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
                <div
                  key={i}
                  className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[7rem_9rem_1fr_5rem_5rem_1fr_auto]"
                >
                  <form.Field name={`entries[${i}].type`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Type</FieldLabel>}
                        <select
                          className={selectClassName}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value as 'receive' | 'issue')}
                        >
                          <option value="receive">Receive</option>
                          <option value="issue">Issue</option>
                        </select>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].itemId`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Item</FieldLabel>}
                        <select
                          className={selectClassName}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value)}
                        >
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
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].particulars`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Particulars</FieldLabel>}
                        <Input
                          ref={i === 0 ? particularsRef : undefined}
                          list="particular-suggestions"
                          autoFocus={i === 0}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].qty`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Qty</FieldLabel>}
                        <NumberFieldInput value={subField.state.value} onChange={subField.handleChange} />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name={`entries[${i}].unit`}>
                    {(subField) => (
                      <Field>
                        {i === 0 && <FieldLabel>Unit</FieldLabel>}
                        <select
                          className={selectClassName}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value as 'box' | 'pcs' | 'grams')}
                        >
                          <option value="pcs">Pcs</option>
                          <option value="box">Box</option>
                          <option value="grams">Grams</option>
                        </select>
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
                    ✕
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
