'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyEntries } from '@/lib/cash-sheets'

const EntryRowSchema = z.object({
  type: z.enum(['receipt', 'payment']),
  particular: z.string().trim(),
  amount: z.coerce.number().min(0),
  remark: z.string().trim().optional().default(''),
})

const AddEntriesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.'),
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
  if (entries.length === 0) {
    return { success: false, error: 'Add at least one entry with a particular and an amount.' }
  }

  try {
    await addMyEntries({ date: parsed.data.date, entries })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add entries.' }
  }

  revalidatePath('/my-entries')
  revalidatePath('/cash-sheets')
  return { success: true }
}
