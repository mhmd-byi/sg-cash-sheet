'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { formatINR } from '@/lib/currency'
import { saveCashSheet } from '../actions'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import type { CashSheetDetail, CashSheetRowDTO } from '@/lib/cash-sheets'

type FormRow = Omit<CashSheetRowDTO, 'id' | 'enteredByName' | 'status'> & Partial<Pick<CashSheetRowDTO, 'id' | 'enteredByName'>>

interface CashSheetFormValues {
  openingBalance: number
  actualClosingCash: number | null
  receipts: FormRow[]
  payments: FormRow[]
}

function emptyRow(): FormRow {
  return { particular: '', amount: 0, remark: '' }
}

export function CashSheetForm({
  date,
  initialData,
  defaultOpeningBalance,
  particularSuggestions,
}: {
  date: string
  initialData: CashSheetDetail | null
  defaultOpeningBalance: number
  particularSuggestions: string[]
}) {
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      openingBalance: initialData?.openingBalance ?? defaultOpeningBalance,
      actualClosingCash: initialData?.actualClosingCash ?? null,
      receipts: initialData?.receipts ?? [],
      payments: initialData?.payments ?? [],
    } as CashSheetFormValues,
    onSubmit: async ({ value }) => {
      const result = await saveCashSheet(date, value)
      if (result.success) {
        toast.success('Cash sheet saved.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save cash sheet.')
      }
    },
  })

  function renderRows(name: 'receipts' | 'payments', title: string) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form.Field name={name} mode="array">
            {(field) => (
              <div
                className="contents"
                onKeyDown={(e) => {
                  const isAddRowShortcut =
                    (e.altKey && e.key === 'Enter') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter')
                  if (isAddRowShortcut) {
                    e.preventDefault()
                    e.stopPropagation()
                    field.pushValue(emptyRow())
                  }
                }}
              >
                {field.state.value.map((row: FormRow, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_7rem_1fr_6rem_auto] items-end gap-2">
                    <form.Field name={`${name}[${i}].particular`}>
                      {(subField) => (
                        <Field>
                          {i === 0 && <FieldLabel>Particular</FieldLabel>}
                          <Input
                            list="particular-suggestions"
                            value={subField.state.value}
                            onChange={(e) => subField.handleChange(e.target.value)}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`${name}[${i}].amount`}>
                      {(subField) => (
                        <Field>
                          {i === 0 && <FieldLabel>Amount</FieldLabel>}
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
                    <Field>
                      {i === 0 && <FieldLabel>Entered By</FieldLabel>}
                      <span className="truncate text-sm text-muted-foreground" title={row.enteredByName}>
                        {row.enteredByName ?? '—'}
                      </span>
                    </Field>
                    <Button type="button" variant="ghost" size="icon" onClick={() => field.removeValue(i)}>
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue(emptyRow())}
                  className="self-start"
                >
                  Add row
                </Button>
              </div>
            )}
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
      className="flex flex-1 flex-col gap-4"
    >
      <datalist id="particular-suggestions">
        {particularSuggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">{date}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <form.Field name="openingBalance">
            {(field) => (
              <Field orientation="horizontal" className="w-auto items-center">
                <FieldLabel htmlFor="openingBalance">Opening Balance (₹)</FieldLabel>
                <NumberFieldInput
                  id="openingBalance"
                  step="0.01"
                  className="w-40"
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="actualClosingCash">
            {(field) => (
              <Field orientation="horizontal" className="w-auto items-center">
                <FieldLabel htmlFor="actualClosingCash">Actual Cash Counted (₹)</FieldLabel>
                <Input
                  id="actualClosingCash"
                  type="number"
                  step="0.01"
                  className="w-40"
                  placeholder="Not counted"
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value === '' ? null : Number(e.target.value))}
                />
              </Field>
            )}
          </form.Field>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {renderRows('receipts', 'Receipts')}
        {renderRows('payments', 'Payments')}
      </div>

      <form.Subscribe
        selector={(state) => ({
          receipts: state.values.receipts,
          payments: state.values.payments,
          openingBalance: state.values.openingBalance,
          actualClosingCash: state.values.actualClosingCash,
        })}
      >
        {({ receipts, payments, openingBalance, actualClosingCash }) => {
          const totalReceipts = receipts.reduce((sum, row) => sum + (row.amount || 0), 0)
          const totalPayments = payments.reduce((sum, row) => sum + (row.amount || 0), 0)
          const closingBalance = (openingBalance || 0) + totalReceipts - totalPayments
          const variance = actualClosingCash == null ? null : actualClosingCash - closingBalance

          return (
            <Card size="sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <Totals label="Total Receipt" value={totalReceipts} />
                <Totals label="Total Payment" value={totalPayments} />
                <Totals label="Closing Balance" value={closingBalance} emphasize />
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Cash Variance</span>
                  {variance == null ? (
                    <span className="font-medium text-muted-foreground">Not counted</span>
                  ) : (
                    <span className={`font-medium ${variance < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {variance >= 0 ? '+' : ''}
                      {formatINR(variance)} {variance >= 0 ? 'excess' : 'short'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        }}
      </form.Subscribe>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="self-end">
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

function Totals({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={emphasize ? 'text-lg font-semibold' : 'font-medium'}>{formatINR(value)}</span>
    </div>
  )
}
