'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyEntry } from '@/lib/cash-sheets'

const AddEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.'),
  type: z.enum(['receipt', 'payment']),
  particular: z.string().trim().min(1, 'Particular is required.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  remark: z.string().trim().optional().default(''),
})

export interface AddEntryResult {
  success: boolean
  error?: string
}

export async function addEntry(_prevState: AddEntryResult | undefined, formData: FormData): Promise<AddEntryResult> {
  const parsed = AddEntrySchema.safeParse({
    date: formData.get('date'),
    type: formData.get('type'),
    particular: formData.get('particular'),
    amount: formData.get('amount'),
    remark: formData.get('remark'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await addMyEntry(parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add entry.' }
  }

  revalidatePath('/my-entries')
  revalidatePath('/cash-sheets')
  return { success: true }
}
