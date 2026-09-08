'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAllNotificationsRead } from './actions'
import { Button } from '@/components/ui/button'

export function MarkAllReadButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      Mark all as read
    </Button>
  )
}
