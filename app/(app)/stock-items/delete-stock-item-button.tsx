'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteStockItem } from './actions'
import { Button } from '@/components/ui/button'

export function DeleteStockItemButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return

    startTransition(async () => {
      const result = await deleteStockItem(id)
      if (result.success) {
        toast.success('Item deleted.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete item.')
      }
    })
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      Delete
    </Button>
  )
}
