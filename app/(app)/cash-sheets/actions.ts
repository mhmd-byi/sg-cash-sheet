'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { saveCashSheet as saveCashSheetDAL } from '@/lib/cash-sheets'

const RowSchema = z.object({
  id: z.string().optional(),
  particular: z.string().trim(),
  amount: z.coerce.number().min(0),
  remark: z.string().trim().optional().default(''),
})

const CashSheetInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    openingBalance: z.coerce.number(),
    receipts: z.array(RowSchema),
    payments: z.array(RowSchema),
  })
  .superRefine((val, ctx) => {
    for (const row of [...val.receipts, ...val.payments]) {
      if (row.amount > 0 && row.particular === '') {
        ctx.addIssue({ code: 'custom', message: 'Particular is required when an amount is entered.' })
      }
    }
  })

export interface SaveCashSheetResult {
  success: boolean
  error?: string
}

export async function saveCashSheet(date: string, input: unknown): Promise<SaveCashSheetResult> {
  const parsed = CashSheetInputSchema.safeParse({ date, ...(input as object) })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const clean = {
    ...parsed.data,
    receipts: parsed.data.receipts.filter((r) => r.particular !== '' || r.amount !== 0),
    payments: parsed.data.payments.filter((p) => p.particular !== '' || p.amount !== 0),
  }

  await saveCashSheetDAL(clean)
  revalidatePath('/cash-sheets')
  revalidatePath(`/cash-sheets/${date}`)
  return { success: true }
}
