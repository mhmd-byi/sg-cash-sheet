'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createStockItem as createStockItemDAL,
  updateStockItem as updateStockItemDAL,
  deleteStockItem as deleteStockItemDAL,
} from '@/lib/stock-items'

const NameSchema = z.string().trim().min(1, 'Name is required.')

export interface CreateStockItemResult {
  success: boolean
  error?: string
}

export async function createStockItem(
  _prevState: CreateStockItemResult | undefined,
  formData: FormData,
): Promise<CreateStockItemResult> {
  const parsed = NameSchema.safeParse(formData.get('name'))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await createStockItemDAL(parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create item.' }
  }

  revalidatePath('/stock-items')
  return { success: true }
}

export interface UpdateStockItemResult {
  success: boolean
  error?: string
}

export async function updateStockItem(
  id: string,
  _prevState: UpdateStockItemResult | undefined,
  formData: FormData,
): Promise<UpdateStockItemResult> {
  const parsed = NameSchema.safeParse(formData.get('name'))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await updateStockItemDAL(id, parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update item.' }
  }

  revalidatePath('/stock-items')
  redirect('/stock-items')
}

export interface DeleteStockItemResult {
  success: boolean
  error?: string
}

export async function deleteStockItem(id: string): Promise<DeleteStockItemResult> {
  try {
    await deleteStockItemDAL(id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete item.' }
  }

  revalidatePath('/stock-items')
  return { success: true }
}
