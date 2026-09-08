'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteStockSheet } from './actions'
import { Button } from '@/components/ui/button'

export function DeleteStockSheetButton({ date }: { date: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete all entries for ${date}? This removes the entire day's sheet and cannot be undone.`)) return

    startTransition(async () => {
      const result = await deleteStockSheet(date)
      if (result.success) {
        toast.success('Sheet deleted.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete sheet.')
      }
    })
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      Delete
    </Button>
  )
}
