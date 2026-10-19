'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateCashSheetKeyNote } from './cash-sheets/actions'
import { updateStockSheetKeyNote } from './stock-sheets/actions'

export function KeyNoteEditor({
  date,
  kind,
  initialValue,
}: {
  date: string
  kind: 'cash' | 'stock'
  initialValue: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = kind === 'cash' ? await updateCashSheetKeyNote(date, value) : await updateStockSheetKeyNote(date, value)
      if (result.success) {
        toast.success('Key note saved.')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save key note.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Note</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          rows={2}
          placeholder="Add a note for this day…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="button" size="sm" onClick={handleSave} disabled={isPending} className="self-end">
          {isPending ? 'Saving…' : 'Save Note'}
        </Button>
      </CardContent>
    </Card>
  )
}
