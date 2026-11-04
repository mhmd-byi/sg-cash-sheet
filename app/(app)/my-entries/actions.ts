'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyEntries, getCashSheetFigures, type CashSheetFigures } from '@/lib/cash-sheets'

const EntryRowSchema = z.object({
  type: z.enum(['receipt', 'payment']),
  particular: z.string().trim(),
  amount: z.coerce.number().min(0),
  remark: z.string().trim().optional().default(''),
})

const AddEntriesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.'),
  openingBalance: z.coerce.number(),
  cashInHand: z.number().nullable(),
  entries: z.array(EntryRowSchema),
})

export interface AddEntriesResult {
  success: boolean
  error?: string
}

export async function addEntries(input: unknown): Promise<AddEntriesResult> {
  const parsed = AddEntriesSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const entries = parsed.data.entries.filter((entry) => entry.particular !== '' && entry.amount > 0)

  try {
    await addMyEntries({
      date: parsed.data.date,
      openingBalance: parsed.data.openingBalance,
      cashInHand: parsed.data.cashInHand,
      entries,
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save.' }
  }

  revalidatePath('/my-entries')
  revalidatePath('/approvals')
  revalidatePath('/cash-sheets')
  revalidatePath(`/cash-sheets/${parsed.data.date}`)
  return { success: true }
}

export async function getCashFigures(date: string): Promise<CashSheetFigures> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { openingBalance: 0, cashInHand: null }
  return getCashSheetFigures(date)
}
