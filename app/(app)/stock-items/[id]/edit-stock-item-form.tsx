'use client'

import { useActionState } from 'react'
import { updateStockItem } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import type { StockItemListItem } from '@/lib/stock-items'

export function EditStockItemForm({ item }: { item: StockItemListItem }) {
  const updateStockItemWithId = updateStockItem.bind(null, item.id)
  const [state, formAction, pending] = useActionState(updateStockItemWithId, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" name="name" defaultValue={item.name} required />
      </Field>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
