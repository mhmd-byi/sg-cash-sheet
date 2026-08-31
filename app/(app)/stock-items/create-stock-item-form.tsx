'use client'

import { useActionState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createStockItem } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

export function CreateStockItemForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction, pending] = useActionState(async (_prevState: unknown, formData: FormData) => {
    const result = await createStockItem(undefined, formData)
    if (result.success) {
      toast.success('Item added.')
      formRef.current?.reset()
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to add item.')
    }
    return result
  }, undefined)

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-3">
      <Field className="max-w-xs">
        <FieldLabel htmlFor="name">Item name</FieldLabel>
        <Input id="name" name="name" required />
      </Field>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add item'}
      </Button>
    </form>
  )
}
