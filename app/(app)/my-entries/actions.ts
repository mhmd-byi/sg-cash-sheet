'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { addMyEntry } from '@/lib/cash-sheets'

const AddEntrySchema = z.object({
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
    type: formData.get('type'),
    particular: formData.get('particular'),
    amount: formData.get('amount'),
    remark: formData.get('remark'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await addMyEntry(parsed.data)
  revalidatePath('/my-entries')
  revalidatePath('/cash-sheets')
  return { success: true }
}
