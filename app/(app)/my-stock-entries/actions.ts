'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyStockEntry } from '@/lib/stock-sheets'

const AddStockEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.'),
  type: z.enum(['receive', 'issue']),
  itemId: z.string().min(1, 'Item is required.'),
  qty: z.coerce.number().positive('Quantity must be greater than zero.'),
  unit: z.enum(['box', 'pcs']),
  remark: z.string().trim().optional().default(''),
})

export interface AddStockEntryResult {
  success: boolean
  error?: string
}

export async function addStockEntry(
  _prevState: AddStockEntryResult | undefined,
  formData: FormData,
): Promise<AddStockEntryResult> {
  const parsed = AddStockEntrySchema.safeParse({
    date: formData.get('date'),
    type: formData.get('type'),
    itemId: formData.get('itemId'),
    qty: formData.get('qty'),
    unit: formData.get('unit'),
    remark: formData.get('remark'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await addMyStockEntry(parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add entry.' }
  }

  revalidatePath('/my-stock-entries')
  revalidatePath('/stock-sheets')
  return { success: true }
}
