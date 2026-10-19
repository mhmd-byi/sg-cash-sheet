import 'server-only'
import { verifySession, requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { StockItem } from '@/models/StockItem'
import { StockSheet } from '@/models/StockSheet'

export interface StockItemListItem {
  id: string
  name: string
}

export async function getStockItemsList(): Promise<StockItemListItem[]> {
  await verifySession()
  await connectDB()

  const items = await StockItem.find().sort({ sortOrder: 1 }).lean()
  return items.map((item) => ({ id: item._id.toString(), name: item.name }))
}

export async function getStockItemById(id: string): Promise<StockItemListItem | null> {
  await requireAdmin()
  await connectDB()

  const item = await StockItem.findById(id).lean()
  if (!item) return null
  return { id: item._id.toString(), name: item.name }
}

// Resolves a free-typed item name (from a stock entry row) to its StockItem id, creating a new
// Stock Item on the fly if no exact name match exists yet - lets a maker log an entry for a new
// item without waiting on admin to add it via /stock-items first.
export async function findOrCreateStockItemByName(name: string): Promise<string> {
  await verifySession()
  await connectDB()

  const trimmed = name.trim()
  const existing = await StockItem.findOne({ name: trimmed })
  if (existing) return existing._id.toString()

  const count = await StockItem.countDocuments()
  const created = await StockItem.create({ name: trimmed, sortOrder: count })
  return created._id.toString()
}

export async function createStockItem(name: string) {
  await requireAdmin()
  await connectDB()

  const trimmed = name.trim()
  const existing = await StockItem.findOne({ name: trimmed })
  if (existing) {
    throw new Error('An item with this name already exists.')
  }

  const count = await StockItem.countDocuments()
  await StockItem.create({ name: trimmed, sortOrder: count })
}

export async function updateStockItem(id: string, name: string) {
  await requireAdmin()
  await connectDB()

  const trimmed = name.trim()
  const existing = await StockItem.findOne({ name: trimmed, _id: { $ne: id } })
  if (existing) {
    throw new Error('An item with this name already exists.')
  }

  await StockItem.findByIdAndUpdate(id, { $set: { name: trimmed } }, { runValidators: true })
}

export async function deleteStockItem(id: string) {
  await requireAdmin()
  await connectDB()

  const hasHistory = await StockSheet.exists({
    $or: [{ 'items.itemId': id }, { 'transfers.itemId': id }],
  })
  if (hasHistory) {
    throw new Error('Cannot delete an item that has stock history.')
  }

  await StockItem.findByIdAndDelete(id)
}
