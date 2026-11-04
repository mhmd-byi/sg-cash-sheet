'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { X } from 'lucide-react'
import { addEntries, getCashFigures } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import { getTodayDateString, getEarliestEntryDateString } from '@/lib/date'
import type { CashSheetFigures } from '@/lib/cash-sheets'

type Section = 'receipts' | 'payments'

interface EntryRow {
  particular: string
  amount: number
  remark: string
}

interface EntriesFormValues {
  date: string
  openingBalance: number
  cashInHand: number | null
  receipts: EntryRow[]
  payments: EntryRow[]
}

function emptyEntry(): EntryRow {
  return { particular: '', amount: 0, remark: '' }
}

export function EntryForm({
  particularSuggestions,
  initialFigures,
}: {
  particularSuggestions: string[]
  initialFigures: CashSheetFigures
}) {
  const router = useRouter()
  const particularRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [focusTarget, setFocusTarget] = useState<{ section: Section; index: number } | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (focusTarget === null) return
    particularRefs.current[`${focusTarget.section}-${focusTarget.index}`]?.focus()
    setFocusTarget(null)
  }, [focusTarget])

  const form = useForm({
    defaultValues: {
      date: getTodayDateString(),
      openingBalance: initialFigures.openingBalance,
      cashInHand: initialFigures.cashInHand,
      receipts: [emptyEntry()],
      payments: [emptyEntry()],
    } as EntriesFormValues,
    onSubmit: async ({ value, formApi }) => {
      const entries = [
        ...value.receipts.map((row) => ({ type: 'receipt' as const, ...row })),
        ...value.payments.map((row) => ({ type: 'payment' as const, ...row })),
      ]
      const result = await addEntries({
        date: value.date,
        openingBalance: value.openingBalance,
        cashInHand: value.cashInHand,
        entries,
      })
      if (result.success) {
        toast.success('Saved.')
        formApi.setFieldValue('receipts', [emptyEntry()])
        formApi.setFieldValue('payments', [emptyEntry()])
        particularRefs.current['receipts-0']?.focus()
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save.')
      }
    },
  })

  function loadFigures(date: string) {
    if (!date) return
    startTransition(async () => {
      const figures = await getCashFigures(date)
      if (form.state.values.date !== date) return
      form.setFieldValue('openingBalance', figures.openingBalance)
      form.setFieldValue('cashInHand', figures.cashInHand)
    })
  }

  function renderSection(name: Section, title: string) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form.Field name={name} mode="array">
            {(field) => {
              function addRow() {
                setFocusTarget({ section: name, index: field.state.value.length })
                field.pushValue(emptyEntry())
              }

              return (
                <div
                  className="contents"
                  onKeyDown={(e) => {
                    const isAddRowShortcut =
                      (e.altKey && e.key === 'Enter') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter')
                    if (isAddRowShortcut) {
                      e.preventDefault()
                      e.stopPropagation()
                      addRow()
                    }
                  }}
                >
                  {field.state.value.map((_, i) => (
                    <div key={i} className="grid grid-cols-[1fr_7rem_1fr_auto] items-end gap-2">
                      <form.Field name={`${name}[${i}].particular`}>
                        {(subField) => (
                          <Field>
                            {i === 0 && <FieldLabel>Particular</FieldLabel>}
                            <Input
                              ref={(el) => {
                                particularRefs.current[`${name}-${i}`] = el
                              }}
                              list="particular-suggestions"
                              autoFocus={name === 'receipts' && i === 0}
                              value={subField.state.value}
                              onChange={(e) => subField.handleChange(e.target.value)}
                            />
                          </Field>
                        )}
                      </form.Field>
                      <form.Field name={`${name}[${i}].amount`}>
                        {(subField) => (
                          <Field>
                            {i === 0 && <FieldLabel>Amount (₹)</FieldLabel>}
                            <NumberFieldInput step="0.01" value={subField.state.value} onChange={subField.handleChange} />
                          </Field>
                        )}
                      </form.Field>
                      <form.Field name={`${name}[${i}].remark`}>
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
                  <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
                    Add row
                  </Button>
                </div>
              )
            }}
          </form.Field>
        </CardContent>
      </Card>
    )
  }

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

      <div className="flex flex-wrap items-end gap-3">
        <form.Field name="date">
          {(field) => (
            <Field className="w-40">
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <Input
                id="date"
                type="date"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  loadFigures(e.target.value)
                }}
                min={getEarliestEntryDateString()}
                max={getTodayDateString()}
                required
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="openingBalance">
          {(field) => (
            <Field className="w-44">
              <FieldLabel htmlFor="openingBalance">Opening Balance (₹)</FieldLabel>
              <NumberFieldInput
                id="openingBalance"
                step="0.01"
                value={field.state.value}
                onChange={field.handleChange}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="cashInHand">
          {(field) => (
            <Field className="w-44">
              <FieldLabel htmlFor="cashInHand">Cash in Hand (₹)</FieldLabel>
              <Input
                id="cashInHand"
                type="number"
                step="0.01"
                placeholder="Not counted"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value === '' ? null : Number(e.target.value))}
              />
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderSection('receipts', 'Receipts')}
        {renderSection('payments', 'Payments')}
      </div>

      <p className="text-xs text-muted-foreground">
        You can log entries for today or up to 7 days back. Ctrl+Enter saves all rows; Ctrl+Shift+Enter (or Alt+Enter)
        adds a row to the section you&apos;re in.
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
