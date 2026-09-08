'use server'

import { revalidatePath } from 'next/cache'
import { approveEntry as approveEntryDAL, rejectEntry as rejectEntryDAL } from '@/lib/cash-sheets'
import {
  approveStockEntry as approveStockEntryDAL,
  rejectStockEntry as rejectStockEntryDAL,
} from '@/lib/stock-sheets'

export interface ApprovalActionResult {
  success: boolean
  error?: string
}

function revalidateCashPaths(date: string) {
  revalidatePath('/approvals')
  revalidatePath('/cash-sheets')
  revalidatePath('/cash-sheets/entries')
  revalidatePath(`/cash-sheets/${date}`)
}

function revalidateStockPaths(date: string) {
  revalidatePath('/approvals/stock')
  revalidatePath('/stock-sheets')
  revalidatePath('/stock-sheets/entries')
  revalidatePath(`/stock-sheets/${date}`)
}

export async function approveCashEntry(date: string, id: string): Promise<ApprovalActionResult> {
  try {
    await approveEntryDAL(date, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to approve entry.' }
  }
  revalidateCashPaths(date)
  return { success: true }
}

export async function rejectCashEntry(date: string, id: string): Promise<ApprovalActionResult> {
  try {
    await rejectEntryDAL(date, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject entry.' }
  }
  revalidateCashPaths(date)
  return { success: true }
}

export async function approveStockEntry(date: string, id: string): Promise<ApprovalActionResult> {
  try {
    await approveStockEntryDAL(date, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to approve entry.' }
  }
  revalidateStockPaths(date)
  return { success: true }
}

export async function rejectStockEntry(date: string, id: string): Promise<ApprovalActionResult> {
  try {
    await rejectStockEntryDAL(date, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject entry.' }
  }
  revalidateStockPaths(date)
  return { success: true }
}
