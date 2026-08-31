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
import type { CashSheetDetail, CashSheetRowDTO } from '@/lib/cash-sheets'

type FormRow = Omit<CashSheetRowDTO, 'id' | 'enteredByName'> & Partial<Pick<CashSheetRowDTO, 'id' | 'enteredByName'>>

interface CashSheetFormValues {
  openingBalance: number
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
}: {
  date: string
  initialData: CashSheetDetail | null
  defaultOpeningBalance: number
}) {
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      openingBalance: initialData?.openingBalance ?? defaultOpeningBalance,
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
              <>
                {field.state.value.map((row: FormRow, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_7rem_1fr_6rem_auto] items-end gap-2">
                    <form.Field name={`${name}[${i}].particular`}>
                      {(subField) => (
                        <Field>
                          {i === 0 && <FieldLabel>Particular</FieldLabel>}
                          <Input value={subField.state.value} onChange={(e) => subField.handleChange(e.target.value)} />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`${name}[${i}].amount`}>
                      {(subField) => (
                        <Field>
                          {i === 0 && <FieldLabel>Amount</FieldLabel>}
                          <Input
                            type="number"
                            step="0.01"
                            value={subField.state.value}
                            onChange={(e) => subField.handleChange(e.target.valueAsNumber || 0)}
                          />
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
              </>
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
      className="flex flex-1 flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-medium">{date}</h1>
        <form.Field name="openingBalance">
          {(field) => (
            <Field orientation="horizontal" className="w-auto items-center">
              <FieldLabel htmlFor="openingBalance">Opening Balance (₹)</FieldLabel>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                className="w-40"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
              />
            </Field>
          )}
        </form.Field>
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
        })}
      >
        {({ receipts, payments, openingBalance }) => {
          const totalReceipts = receipts.reduce((sum, row) => sum + (row.amount || 0), 0)
          const totalPayments = payments.reduce((sum, row) => sum + (row.amount || 0), 0)
          const closingBalance = (openingBalance || 0) + totalReceipts - totalPayments

          return (
            <Card size="sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <Totals label="Total Receipt" value={totalReceipts} />
                <Totals label="Total Payment" value={totalPayments} />
                <Totals label="Closing Balance" value={closingBalance} emphasize />
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
