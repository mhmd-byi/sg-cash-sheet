'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyStockEntries } from '@/lib/stock-sheets'

const EntryRowSchema = z.object({
  type: z.enum(['receive', 'issue']),
  itemId: z.string(),
  particulars: z.string().trim().optional().default(''),
  qty: z.coerce.number().min(0),
  unit: z.enum(['box', 'pcs', 'grams']),
  remark: z.string().trim().optional().default(''),
})

const AddStockEntriesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.'),
  entries: z.array(EntryRowSchema),
})

export interface AddStockEntriesResult {
  success: boolean
  error?: string
}

export async function addStockEntries(input: unknown): Promise<AddStockEntriesResult> {
  const parsed = AddStockEntriesSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const entries = parsed.data.entries.filter((entry) => entry.itemId !== '' && entry.qty > 0)
  if (entries.length === 0) {
    return { success: false, error: 'Add at least one entry with an item and a quantity.' }
  }

  try {
    await addMyStockEntries({ date: parsed.data.date, entries })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add entries.' }
  }

  revalidatePath('/my-stock-entries')
  revalidatePath('/stock-sheets')
  return { success: true }
}
