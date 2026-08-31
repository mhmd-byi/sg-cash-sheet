'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTodayDateString } from '@/lib/date'

export function DateJumpForm({ basePath }: { basePath: string }) {
  const router = useRouter()
  const [date, setDate] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (date) router.push(`${basePath}/${date}`)
      }}
      className="flex items-end gap-2"
    >
      <Input
        type="date"
        value={date}
        max={getTodayDateString()}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Jump to date"
        className="w-40"
      />
      <Button type="submit" variant="outline">
        Go
      </Button>
    </form>
  )
}
