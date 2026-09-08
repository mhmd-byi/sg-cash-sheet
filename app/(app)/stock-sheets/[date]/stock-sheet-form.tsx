'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { saveStockSheet } from '../actions'
import { NumberFieldInput } from '@/app/(app)/number-field-input'
import type { StockSheetDetail } from '@/lib/stock-sheets'

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface StockItemFormRow {
  itemId: string
  openingBox: number
  openingPcs: number
  openingRemark: string
  closingBox: number
  closingPcs: number
  closingRemark: string
  displayPcs: number
  displayRemark: string
}

interface TransferFormRow {
  id?: string
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
  enteredByName?: string
}

interface StockSheetFormValues {
  items: StockItemFormRow[]
  transfers: TransferFormRow[]
}

function emptyTransfer(): TransferFormRow {
  return { type: 'receive', itemId: '', particulars: '', qty: 0, unit: 'pcs', remark: '' }
}

export function StockSheetForm({
  date,
  detail,
  particularSuggestions,
}: {
  date: string
  detail: StockSheetDetail
  particularSuggestions: string[]
}) {
  const router = useRouter()
  const itemOptions = detail.items.map((item) => ({ id: item.itemId, name: item.itemName }))
  const expectedPcsByItemId = new Map(detail.items.map((item) => [item.itemId, item.expectedClosingPcs]))
  const expectedBoxByItemId = new Map(detail.items.map((item) => [item.itemId, item.expectedClosingBox]))

  const form = useForm({
    defaultValues: {
      items: detail.items.map((item) => ({
        itemId: item.itemId,
        openingBox: item.openingBox,
        openingPcs: item.openingPcs,
        openingRemark: item.openingRemark,
        closingBox: item.closingBox,
        closingPcs: item.closingPcs,
        closingRemark: item.closingRemark,
        displayPcs: item.displayPcs,
        displayRemark: item.displayRemark,
      })),
      transfers: detail.transfers.map((row) => ({
        id: row.id,
        type: row.type,
        itemId: row.itemId,
        particulars: row.particulars,
        qty: row.qty,
        unit: row.unit,
        remark: row.remark,
        enteredByName: row.enteredByName,
      })),
    } as StockSheetFormValues,
    onSubmit: async ({ value }) => {
      const result = await saveStockSheet(date, value)
      if (result.success) {
        toast.success('Stock sheet saved.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save stock sheet.')
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
      className="flex flex-1 flex-col gap-4"
    >
      <datalist id="particular-suggestions">
        {particularSuggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <h1 className="font-heading text-lg font-medium">{date}</h1>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Opening Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {detail.items.map((item, i) => (
              <div key={item.itemId} className="grid grid-cols-[1fr_5rem_5rem_1fr] items-end gap-2">
                {i === 0 && (
                  <>
                    <span className="text-sm font-medium">Item</span>
                    <span className="text-sm font-medium">Box</span>
                    <span className="text-sm font-medium">Pcs</span>
                    <span className="text-sm font-medium">Remark</span>
                  </>
                )}
                <span className="flex items-center text-sm">{item.itemName}</span>
                <form.Field name={`items[${i}].openingBox`}>
                  {(field) => <NumberFieldInput value={field.state.value} onChange={field.handleChange} />}
                </form.Field>
                <form.Field name={`items[${i}].openingPcs`}>
                  {(field) => <NumberFieldInput value={field.state.value} onChange={field.handleChange} />}
                </form.Field>
                <form.Field name={`items[${i}].openingRemark`}>
                  {(field) => (
                    <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                  )}
                </form.Field>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Stock</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {detail.items.map((item, i) => (
              <div key={item.itemId} className="grid grid-cols-[1fr_5rem_5rem_1fr] items-end gap-2">
                {i === 0 && (
                  <>
                    <span className="text-sm font-medium">Item</span>
                    <span className="text-sm font-medium">Box</span>
                    <span className="text-sm font-medium">Pcs</span>
                    <span className="text-sm font-medium">Remark</span>
                  </>
                )}
                <span className="flex items-center text-sm">{item.itemName}</span>
                <div className="flex flex-col gap-0.5">
                  <form.Field name={`items[${i}].closingBox`}>
                    {(field) => <NumberFieldInput value={field.state.value} onChange={field.handleChange} />}
                  </form.Field>
                  <span className="text-xs text-muted-foreground">expected {expectedBoxByItemId.get(item.itemId) ?? 0}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <form.Field name={`items[${i}].closingPcs`}>
                    {(field) => <NumberFieldInput value={field.state.value} onChange={field.handleChange} />}
                  </form.Field>
                  <span className="text-xs text-muted-foreground">expected {expectedPcsByItemId.get(item.itemId) ?? 0}</span>
                </div>
                <form.Field name={`items[${i}].closingRemark`}>
                  {(field) => (
                    <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                  )}
                </form.Field>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Display Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {detail.items.map((item, i) => (
            <div key={item.itemId} className="grid grid-cols-[1fr_5rem_1fr] items-end gap-2">
              {i === 0 && (
                <>
                  <span className="text-sm font-medium">Item</span>
                  <span className="text-sm font-medium">Pcs</span>
                  <span className="text-sm font-medium">Remark</span>
                </>
              )}
              <span className="flex items-center text-sm">{item.itemName}</span>
              <form.Field name={`items[${i}].displayPcs`}>
                {(field) => <NumberFieldInput value={field.state.value} onChange={field.handleChange} />}
              </form.Field>
              <form.Field name={`items[${i}].displayRemark`}>
                {(field) => <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />}
              </form.Field>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfers (Receive / Issue)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form.Field name="transfers" mode="array">
            {(field) => (
              <div
                className="contents"
                onKeyDown={(e) => {
                  const isAddRowShortcut =
                    (e.altKey && e.key === 'Enter') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter')
                  if (isAddRowShortcut) {
                    e.preventDefault()
                    e.stopPropagation()
                    field.pushValue(emptyTransfer())
                  }
                }}
              >
                {field.state.value.map((row: TransferFormRow, i: number) => (
                  <div key={i} className="grid grid-cols-[7rem_10rem_1fr_5rem_6rem_1fr_8rem_auto] items-end gap-2">
                    <form.Field name={`transfers[${i}].type`}>
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
                    <form.Field name={`transfers[${i}].itemId`}>
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
                            {itemOptions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`transfers[${i}].particulars`}>
                      {(subField) => (
                        <Field>
                          {i === 0 && <FieldLabel>Particulars</FieldLabel>}
                          <Input
                            list="particular-suggestions"
                            value={subField.state.value}
                            onChange={(e) => subField.handleChange(e.target.value)}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`transfers[${i}].qty`}>
                      {(subField) => (
                        <Field>
                          {i === 0 && <FieldLabel>Qty</FieldLabel>}
                          <NumberFieldInput value={subField.state.value} onChange={subField.handleChange} />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`transfers[${i}].unit`}>
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
                    <form.Field name={`transfers[${i}].remark`}>
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
                      <X />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue(emptyTransfer())}
                  className="self-start"
                >
                  Add row
                </Button>
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

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
