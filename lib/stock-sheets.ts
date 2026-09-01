import 'server-only'
import mongoose from 'mongoose'
import { verifySession, requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { isWithinEntryWindow, ENTRY_BACKDATE_WINDOW_DAYS } from '@/lib/date'
import { StockSheet, type StockTransferRow } from '@/models/StockSheet'
import { StockItem } from '@/models/StockItem'

export interface StockSheetListItem {
  date: string
  transferCount: number
  updatedByName: string
  updatedAt: string
}

export async function getStockSheetsList(): Promise<StockSheetListItem[]> {
  await requireAdmin()
  await connectDB()

  const sheets = await StockSheet.find()
    .sort({ date: -1 })
    .populate<{ updatedBy: { name: string } }>('updatedBy', 'name')

  return sheets.map((sheet) => ({
    date: sheet.date,
    transferCount: sheet.transfers.length,
    updatedByName: sheet.updatedBy?.name ?? 'Unknown',
    updatedAt: sheet.updatedAt.toISOString(),
  }))
}

export async function getPreviousStockCounts(beforeDate: string): Promise<Map<string, { box: number; pcs: number }>> {
  await requireAdmin()
  await connectDB()

  const sheet = await StockSheet.findOne({ date: { $lt: beforeDate } }).sort({ date: -1 })
  const result = new Map<string, { box: number; pcs: number }>()
  for (const row of sheet?.items ?? []) {
    result.set(row.itemId.toString(), { box: row.closingBox, pcs: row.closingPcs })
  }
  return result
}

export interface StockItemCountDTO {
  itemId: string
  itemName: string
  openingBox: number
  openingPcs: number
  openingRemark: string
  closingBox: number
  closingPcs: number
  closingRemark: string
  displayPcs: number
  displayRemark: string
  expectedClosingBox: number
  expectedClosingPcs: number
}

export interface StockTransferRowDTO {
  id: string
  type: 'receive' | 'issue'
  itemId: string
  itemName: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs'
  remark: string
  enteredByName: string
}

export interface StockSheetDetail {
  date: string
  items: StockItemCountDTO[]
  transfers: StockTransferRowDTO[]
}

type PopulatedTransferRow = Omit<StockTransferRow, 'enteredBy'> & { enteredBy: { name: string } | null }

export async function getStockSheetByDate(date: string): Promise<StockSheetDetail> {
  await requireAdmin()
  await connectDB()

  const activeItems = await StockItem.find().sort({ sortOrder: 1 }).lean()
  const itemNameById = new Map(activeItems.map((item) => [item._id.toString(), item.name]))

  const sheet = await StockSheet.findOne({ date }).populate<{ transfers: PopulatedTransferRow[] }>(
    'transfers.enteredBy',
    'name',
  )

  const storedItemsById = new Map(sheet?.items.map((row) => [row.itemId.toString(), row]) ?? [])
  const previousClosing = sheet ? null : await getPreviousStockCounts(date)

  const netBoxByItem = new Map<string, number>()
  const netPcsByItem = new Map<string, number>()
  for (const row of sheet?.transfers ?? []) {
    const key = row.itemId.toString()
    const delta = row.type === 'receive' ? row.qty : -row.qty
    const unit = row.unit ?? 'pcs'
    const target = unit === 'box' ? netBoxByItem : netPcsByItem
    target.set(key, (target.get(key) ?? 0) + delta)
  }

  const items: StockItemCountDTO[] = activeItems.map((item) => {
    const id = item._id.toString()
    const stored = storedItemsById.get(id)
    const carriedOpening = previousClosing?.get(id)
    const openingBox = stored?.openingBox ?? carriedOpening?.box ?? 0
    const openingPcs = stored?.openingPcs ?? carriedOpening?.pcs ?? 0

    return {
      itemId: id,
      itemName: item.name,
      openingBox,
      openingPcs,
      openingRemark: stored?.openingRemark ?? '',
      closingBox: stored?.closingBox ?? 0,
      closingPcs: stored?.closingPcs ?? 0,
      closingRemark: stored?.closingRemark ?? '',
      displayPcs: stored?.displayPcs ?? 0,
      displayRemark: stored?.displayRemark ?? '',
      expectedClosingBox: openingBox + (netBoxByItem.get(id) ?? 0),
      expectedClosingPcs: openingPcs + (netPcsByItem.get(id) ?? 0),
    }
  })

  const transfers: StockTransferRowDTO[] = (sheet?.transfers ?? []).map((row) => ({
    id: row._id.toString(),
    type: row.type,
    itemId: row.itemId.toString(),
    itemName: itemNameById.get(row.itemId.toString()) ?? 'Unknown item',
    particulars: row.particulars ?? '',
    qty: row.qty,
    unit: row.unit ?? 'pcs',
    remark: row.remark,
    enteredByName: row.enteredBy?.name ?? 'Unknown',
  }))

  return { date, items, transfers }
}

export interface SaveStockItemCountInput {
  itemId: string
  openingBox: number
  openingPcs: number
  openingRemark: string
  closingBox: number
  closingPcs: number
  closingRemark: string
  displayPcs: number
  displayRemark: string
}

export interface SaveStockTransferInput {
  id?: string
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs'
  remark: string
}

export interface SaveStockSheetInput {
  date: string
  items: SaveStockItemCountInput[]
  transfers: SaveStockTransferInput[]
}

export async function saveStockSheet(input: SaveStockSheetInput) {
  const admin = await requireAdmin()
  await connectDB()

  const existing = await StockSheet.findOne({ date: input.date })
  const existingTransfersById = new Map(existing?.transfers.map((row) => [row._id.toString(), row]) ?? [])

  const transfers = input.transfers.map((row) => {
    const match = row.id ? existingTransfersById.get(row.id) : undefined
    return {
      type: row.type,
      itemId: row.itemId,
      particulars: row.particulars,
      qty: row.qty,
      unit: row.unit,
      remark: row.remark,
      enteredBy: match ? match.enteredBy : admin.id,
    }
  })

  const items = input.items.map((row) => ({
    itemId: row.itemId,
    openingBox: row.openingBox,
    openingPcs: row.openingPcs,
    openingRemark: row.openingRemark,
    closingBox: row.closingBox,
    closingPcs: row.closingPcs,
    closingRemark: row.closingRemark,
    displayPcs: row.displayPcs,
    displayRemark: row.displayRemark,
  }))

  await StockSheet.findOneAndUpdate(
    { date: input.date },
    {
      $set: { items, transfers, updatedBy: admin.id },
      $setOnInsert: { createdBy: admin.id },
    },
    { upsert: true, runValidators: true },
  )
}

export interface MyStockEntryRow {
  date: string
  type: 'receive' | 'issue'
  itemName: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs'
  remark: string
}

interface AggregatedStockEntry {
  date: string
  type: 'receive' | 'issue'
  itemId: mongoose.Types.ObjectId
  particulars: string | undefined
  qty: number
  unit: 'box' | 'pcs' | undefined
  remark: string
}

export async function getMyStockEntries(): Promise<MyStockEntryRow[]> {
  const session = await verifySession()
  await connectDB()

  const rows = await StockSheet.aggregate<AggregatedStockEntry>([
    { $unwind: '$transfers' },
    { $match: { 'transfers.enteredBy': new mongoose.Types.ObjectId(session.userId) } },
    { $sort: { date: -1 } },
    {
      $project: {
        _id: 0,
        date: 1,
        type: '$transfers.type',
        itemId: '$transfers.itemId',
        particulars: '$transfers.particulars',
        qty: '$transfers.qty',
        unit: '$transfers.unit',
        remark: '$transfers.remark',
      },
    },
  ])

  const items = await StockItem.find().lean()
  const nameById = new Map(items.map((item) => [item._id.toString(), item.name]))

  return rows.map((row) => ({
    date: row.date,
    type: row.type,
    itemName: nameById.get(row.itemId.toString()) ?? 'Unknown item',
    particulars: row.particulars ?? '',
    qty: row.qty,
    unit: row.unit ?? 'pcs',
    remark: row.remark,
  }))
}

export interface AddMyStockEntryInput {
  date: string
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs'
  remark: string
}

export async function addMyStockEntry(input: AddMyStockEntryInput) {
  const session = await verifySession()
  if (!isWithinEntryWindow(input.date)) {
    throw new Error(`You can only log entries within the last ${ENTRY_BACKDATE_WINDOW_DAYS} days.`)
  }
  await connectDB()

  const date = input.date
  const row = {
    type: input.type,
    itemId: input.itemId,
    particulars: input.particulars,
    qty: input.qty,
    unit: input.unit,
    remark: input.remark,
    enteredBy: session.userId,
  }

  await StockSheet.findOneAndUpdate(
    { date },
    {
      $push: { transfers: row },
      $set: { updatedBy: session.userId },
      $setOnInsert: { createdBy: session.userId },
    },
    { upsert: true, runValidators: true },
  )
}
