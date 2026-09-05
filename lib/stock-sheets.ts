import 'server-only'
import mongoose from 'mongoose'
import { verifySession, requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { isWithinEntryWindow, ENTRY_BACKDATE_WINDOW_DAYS } from '@/lib/date'
import { DEFAULT_PAGE_SIZE, toPaginated, type Paginated } from '@/lib/pagination'
import { StockSheet, type StockTransferRow } from '@/models/StockSheet'
import { StockItem } from '@/models/StockItem'

export interface StockSheetListItem {
  date: string
  transferCount: number
  updatedByName: string
  updatedAt: string
}

export async function getStockSheetsList(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<StockSheetListItem>> {
  await requireAdmin()
  await connectDB()

  const [sheets, total] = await Promise.all([
    StockSheet.find()
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate<{ updatedBy: { name: string } }>('updatedBy', 'name'),
    StockSheet.countDocuments(),
  ])

  const rows = sheets.map((sheet) => ({
    date: sheet.date,
    transferCount: sheet.transfers.length,
    updatedByName: sheet.updatedBy?.name ?? 'Unknown',
    updatedAt: sheet.updatedAt.toISOString(),
  }))

  return toPaginated(rows, total, page, pageSize)
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
  unit: 'box' | 'pcs' | 'grams'
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
  // Always look this up, even if a sheet doc already exists for `date` — one may have been
  // created by a staff member's own transfer entry (My Stock Entries) before any item counts
  // were ever saved, in which case per-item opening values still need to carry forward.
  const previousClosing = await getPreviousStockCounts(date)

  const netBoxByItem = new Map<string, number>()
  const netPcsByItem = new Map<string, number>()
  for (const row of sheet?.transfers ?? []) {
    const key = row.itemId.toString()
    const delta = row.type === 'receive' ? row.qty : -row.qty
    const unit = row.unit ?? 'pcs'
    // Grams-denominated transfers have no closing-count field to reconcile against
    // (only Box and Pcs are tracked on the stock count table), so they're excluded here.
    if (unit === 'box') netBoxByItem.set(key, (netBoxByItem.get(key) ?? 0) + delta)
    else if (unit === 'pcs') netPcsByItem.set(key, (netPcsByItem.get(key) ?? 0) + delta)
  }

  const items: StockItemCountDTO[] = activeItems.map((item) => {
    const id = item._id.toString()
    const stored = storedItemsById.get(id)
    const carriedOpening = previousClosing.get(id)
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
  unit: 'box' | 'pcs' | 'grams'
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
  unit: 'box' | 'pcs' | 'grams'
  remark: string
}

interface AggregatedStockEntry {
  date: string
  type: 'receive' | 'issue'
  itemId: mongoose.Types.ObjectId
  particulars: string | undefined
  qty: number
  unit: 'box' | 'pcs' | 'grams' | undefined
  remark: string
}

export async function getMyStockEntries(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<MyStockEntryRow>> {
  const session = await verifySession()
  await connectDB()

  const [result] = await StockSheet.aggregate<{ data: AggregatedStockEntry[]; total: { count: number }[] }>([
    { $unwind: '$transfers' },
    { $match: { 'transfers.enteredBy': new mongoose.Types.ObjectId(session.userId) } },
    { $sort: { date: -1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
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
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const items = await StockItem.find().lean()
  const nameById = new Map(items.map((item) => [item._id.toString(), item.name]))

  const rows = (result?.data ?? []).map((row) => ({
    date: row.date,
    type: row.type,
    itemName: nameById.get(row.itemId.toString()) ?? 'Unknown item',
    particulars: row.particulars ?? '',
    qty: row.qty,
    unit: row.unit ?? 'pcs',
    remark: row.remark,
  }))

  return toPaginated(rows, result?.total[0]?.count ?? 0, page, pageSize)
}

export interface AddMyStockEntryRowInput {
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
}

export interface AddMyStockEntriesInput {
  date: string
  entries: AddMyStockEntryRowInput[]
}

export async function addMyStockEntries(input: AddMyStockEntriesInput) {
  const session = await verifySession()
  if (!isWithinEntryWindow(input.date)) {
    throw new Error(`You can only log entries within the last ${ENTRY_BACKDATE_WINDOW_DAYS} days.`)
  }
  await connectDB()

  const rows = input.entries.map((entry) => ({
    type: entry.type,
    itemId: entry.itemId,
    particulars: entry.particulars,
    qty: entry.qty,
    unit: entry.unit,
    remark: entry.remark,
    enteredBy: session.userId,
  }))

  await StockSheet.findOneAndUpdate(
    { date: input.date },
    {
      $push: { transfers: { $each: rows } },
      $set: { updatedBy: session.userId },
      $setOnInsert: { createdBy: session.userId },
    },
    { upsert: true, runValidators: true },
  )
}

export interface AllStockEntryRow {
  id: string
  date: string
  type: 'receive' | 'issue'
  itemId: string
  itemName: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
  enteredByName: string
}

interface AggregatedAllStockEntry {
  id: string
  date: string
  type: 'receive' | 'issue'
  itemId: mongoose.Types.ObjectId
  particulars: string | null
  qty: number
  unit: 'box' | 'pcs' | 'grams' | null
  remark: string
  enteredByName: string | null
}

export async function getAllStockEntries(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<AllStockEntryRow>> {
  await requireAdmin()
  await connectDB()

  const [result] = await StockSheet.aggregate<{ data: AggregatedAllStockEntry[]; total: { count: number }[] }>([
    { $unwind: '$transfers' },
    { $sort: { date: -1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          { $lookup: { from: 'users', localField: 'transfers.enteredBy', foreignField: '_id', as: 'enteredByUser' } },
          { $unwind: { path: '$enteredByUser', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              id: { $toString: '$transfers._id' },
              date: 1,
              type: '$transfers.type',
              itemId: '$transfers.itemId',
              particulars: '$transfers.particulars',
              qty: '$transfers.qty',
              unit: '$transfers.unit',
              remark: '$transfers.remark',
              enteredByName: '$enteredByUser.name',
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const items = await StockItem.find().lean()
  const nameById = new Map(items.map((item) => [item._id.toString(), item.name]))

  const rows = (result?.data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    itemId: row.itemId.toString(),
    itemName: nameById.get(row.itemId.toString()) ?? 'Unknown item',
    particulars: row.particulars ?? '',
    qty: row.qty,
    unit: row.unit ?? 'pcs',
    remark: row.remark,
    enteredByName: row.enteredByName ?? 'Unknown',
  }))

  return toPaginated(rows, result?.total[0]?.count ?? 0, page, pageSize)
}

export interface UpdateStockEntryInput {
  type: 'receive' | 'issue'
  itemId: string
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
}

export async function updateStockEntry(date: string, id: string, input: UpdateStockEntryInput) {
  const admin = await requireAdmin()
  await connectDB()

  const result = await StockSheet.updateOne(
    { date, 'transfers._id': id },
    {
      $set: {
        'transfers.$.type': input.type,
        'transfers.$.itemId': input.itemId,
        'transfers.$.particulars': input.particulars,
        'transfers.$.qty': input.qty,
        'transfers.$.unit': input.unit,
        'transfers.$.remark': input.remark,
        updatedBy: admin.id,
      },
    },
  )
  if (result.matchedCount === 0) throw new Error('Entry not found.')
}

export async function deleteStockEntry(date: string, id: string) {
  const admin = await requireAdmin()
  await connectDB()

  await StockSheet.updateOne({ date }, { $pull: { transfers: { _id: id } }, $set: { updatedBy: admin.id } })
}

export async function getDistinctParticulars(): Promise<string[]> {
  await verifySession()
  await connectDB()

  const values = await StockSheet.distinct('transfers.particulars')
  const unique = new Set(values.filter((value): value is string => Boolean(value)))
  return [...unique].sort((a, b) => a.localeCompare(b))
}
