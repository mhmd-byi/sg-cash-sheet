'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { updateStockEntry as updateStockEntryDAL, deleteStockEntry as deleteStockEntryDAL } from '@/lib/stock-sheets'

const UpdateStockEntrySchema = z.object({
  type: z.enum(['receive', 'issue']),
  itemId: z.string().min(1, 'Item is required.'),
  particulars: z.string().trim().optional().default(''),
  qty: z.coerce.number().positive('Quantity must be greater than zero.'),
  unit: z.enum(['box', 'pcs', 'grams']),
  remark: z.string().trim().optional().default(''),
})

export interface StockEntryActionResult {
  success: boolean
  error?: string
}

export async function updateStockEntry(date: string, id: string, input: unknown): Promise<StockEntryActionResult> {
  const parsed = UpdateStockEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await updateStockEntryDAL(date, id, parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update entry.' }
  }

  revalidatePath('/stock-sheets/entries')
  revalidatePath('/stock-sheets')
  revalidatePath(`/stock-sheets/${date}`)
  return { success: true }
}

export async function deleteStockEntry(date: string, id: string): Promise<StockEntryActionResult> {
  try {
    await deleteStockEntryDAL(date, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete entry.' }
  }

  revalidatePath('/stock-sheets/entries')
  revalidatePath('/stock-sheets')
  revalidatePath(`/stock-sheets/${date}`)
  return { success: true }
}
