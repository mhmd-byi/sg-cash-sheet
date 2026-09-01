'use client'

import { Input } from '@/components/ui/input'

export function NumberFieldInput({
  value,
  onChange,
  step = '1',
  className,
  id,
}: {
  value: number
  onChange: (value: number) => void
  step?: string
  className?: string
  id?: string
}) {
  return (
    <Input
      id={id}
      type="number"
      step={step}
      className={className}
      value={Number.isNaN(value) ? '' : value}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw === '' ? NaN : Number(raw))
      }}
      onBlur={() => {
        if (Number.isNaN(value)) onChange(0)
      }}
    />
  )
}
