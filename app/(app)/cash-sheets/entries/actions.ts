'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { updateEntry as updateEntryDAL, deleteEntry as deleteEntryDAL } from '@/lib/cash-sheets'

const UpdateEntrySchema = z.object({
  type: z.enum(['receipt', 'payment']),
  particular: z.string().trim().min(1, 'Particular is required.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  remark: z.string().trim().optional().default(''),
})

export interface EntryActionResult {
  success: boolean
  error?: string
}

export async function updateEntry(date: string, id: string, input: unknown): Promise<EntryActionResult> {
  const parsed = UpdateEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await updateEntryDAL(date, id, parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update entry.' }
  }

  revalidatePath('/cash-sheets/entries')
  revalidatePath('/cash-sheets')
  revalidatePath(`/cash-sheets/${date}`)
  return { success: true }
}

export async function deleteEntry(date: string, id: string): Promise<EntryActionResult> {
  try {
    await deleteEntryDAL(date, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete entry.' }
  }

  revalidatePath('/cash-sheets/entries')
  revalidatePath('/cash-sheets')
  revalidatePath(`/cash-sheets/${date}`)
  return { success: true }
}
