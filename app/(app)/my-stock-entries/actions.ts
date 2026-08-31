'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyStockEntry } from '@/lib/stock-sheets'

const AddStockEntrySchema = z.object({
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
    type: formData.get('type'),
    itemId: formData.get('itemId'),
    qty: formData.get('qty'),
    unit: formData.get('unit'),
    remark: formData.get('remark'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await addMyStockEntry(parsed.data)
  revalidatePath('/my-stock-entries')
  revalidatePath('/stock-sheets')
  return { success: true }
}
