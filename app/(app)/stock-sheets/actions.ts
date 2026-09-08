'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { saveStockSheet as saveStockSheetDAL, deleteStockSheet as deleteStockSheetDAL } from '@/lib/stock-sheets'

const ItemCountSchema = z.object({
  itemId: z.string().min(1),
  openingBox: z.coerce.number().min(0),
  openingPcs: z.coerce.number().min(0),
  openingRemark: z.string().trim().optional().default(''),
  closingBox: z.coerce.number().min(0),
  closingPcs: z.coerce.number().min(0),
  closingRemark: z.string().trim().optional().default(''),
  displayPcs: z.coerce.number().min(0),
  displayRemark: z.string().trim().optional().default(''),
})

const TransferSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['receive', 'issue']),
  itemId: z.string().min(1, 'Item is required.'),
  particulars: z.string().trim().optional().default(''),
  qty: z.coerce.number().min(0),
  unit: z.enum(['box', 'pcs', 'grams']),
  remark: z.string().trim().optional().default(''),
})

const StockSheetInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(ItemCountSchema),
  transfers: z.array(TransferSchema),
})

export interface SaveStockSheetResult {
  success: boolean
  error?: string
}

export async function saveStockSheet(date: string, input: unknown): Promise<SaveStockSheetResult> {
  const parsed = StockSheetInputSchema.safeParse({ date, ...(input as object) })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const clean = {
    ...parsed.data,
    transfers: parsed.data.transfers.filter((row) => row.qty > 0),
  }

  await saveStockSheetDAL(clean)
  revalidatePath('/stock-sheets')
  revalidatePath(`/stock-sheets/${date}`)
  return { success: true }
}

export interface DeleteStockSheetResult {
  success: boolean
  error?: string
}

export async function deleteStockSheet(date: string): Promise<DeleteStockSheetResult> {
  try {
    await deleteStockSheetDAL(date)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete sheet.' }
  }

  revalidatePath('/stock-sheets')
  revalidatePath('/stock-sheets/entries')
  revalidatePath(`/stock-sheets/${date}`)
  return { success: true }
}
