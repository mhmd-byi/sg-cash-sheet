import 'server-only'
import mongoose from 'mongoose'
import { verifySession, requireAdmin, requireCheckerOrAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { isWithinEntryWindow, ENTRY_BACKDATE_WINDOW_DAYS } from '@/lib/date'
import { DEFAULT_PAGE_SIZE, toPaginated, type Paginated } from '@/lib/pagination'
import { createNotification } from '@/lib/notifications'
import { CashSheet, type CashSheetRow } from '@/models/CashSheet'
import { User } from '@/models/User'

export interface CashSheetListItem {
  date: string
  openingBalance: number
  totalReceipts: number
  totalPayments: number
  closingBalance: number
  updatedByName: string
  updatedAt: string
}

export interface CashSheetRowDTO {
  id: string
  particular: string
  amount: number
  remark: string
  enteredByName: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface CashSheetDetail {
  date: string
  openingBalance: number
  actualClosingCash: number | null
  receipts: CashSheetRowDTO[]
  payments: CashSheetRowDTO[]
  totalReceipts: number
  totalPayments: number
  closingBalance: number
  cashVariance: number | null
}

export async function getCashSheetsList(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<CashSheetListItem>> {
  await requireAdmin()
  await connectDB()

  const [sheets, total] = await Promise.all([
    CashSheet.find()
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate<{ updatedBy: { name: string } }>('updatedBy', 'name'),
    CashSheet.countDocuments(),
  ])

  const rows = sheets.map((sheet) => ({
    date: sheet.date,
    openingBalance: sheet.openingBalance,
    totalReceipts: sheet.totalReceipts,
    totalPayments: sheet.totalPayments,
    closingBalance: sheet.closingBalance,
    updatedByName: sheet.updatedBy?.name ?? 'Unknown',
    updatedAt: sheet.updatedAt.toISOString(),
  }))

  return toPaginated(rows, total, page, pageSize)
}

export async function deleteCashSheet(date: string) {
  await requireAdmin()
  await connectDB()

  await CashSheet.deleteOne({ date })
}

type PopulatedRow = Omit<CashSheetRow, 'enteredBy'> & { enteredBy: { name: string } | null }

function toRowDTO(row: PopulatedRow): CashSheetRowDTO {
  return {
    id: row._id.toString(),
    particular: row.particular,
    amount: row.amount,
    remark: row.remark,
    enteredByName: row.enteredBy?.name ?? 'Unknown',
    status: row.status,
  }
}

export async function getCashSheetByDate(date: string): Promise<CashSheetDetail | null> {
  await requireAdmin()
  await connectDB()

  const sheet = await CashSheet.findOne({ date })
    .populate<{ receipts: PopulatedRow[] }>('receipts.enteredBy', 'name')
    .populate<{ payments: PopulatedRow[] }>('payments.enteredBy', 'name')
  if (!sheet) return null

  return {
    date: sheet.date,
    openingBalance: sheet.openingBalance,
    actualClosingCash: sheet.actualClosingCash,
    receipts: sheet.receipts.map(toRowDTO),
    payments: sheet.payments.map(toRowDTO),
    totalReceipts: sheet.totalReceipts,
    totalPayments: sheet.totalPayments,
    closingBalance: sheet.closingBalance,
    cashVariance: sheet.cashVariance,
  }
}

async function findPreviousClosingBalance(beforeDate: string): Promise<number | null> {
  const sheet = await CashSheet.findOne({ date: { $lt: beforeDate } }).sort({ date: -1 })
  return sheet ? sheet.closingBalance : null
}

export async function getPreviousClosingBalance(beforeDate: string): Promise<number | null> {
  await requireAdmin()
  await connectDB()

  return findPreviousClosingBalance(beforeDate)
}

export interface SaveCashSheetRowInput {
  id?: string
  particular: string
  amount: number
  remark: string
}

export interface SaveCashSheetInput {
  date: string
  openingBalance: number
  actualClosingCash: number | null
  receipts: SaveCashSheetRowInput[]
  payments: SaveCashSheetRowInput[]
}

export async function saveCashSheet(input: SaveCashSheetInput) {
  const admin = await requireAdmin()
  await connectDB()

  const existing = await CashSheet.findOne({ date: input.date })
  const existingReceiptsById = new Map(existing?.receipts.map((row) => [row._id.toString(), row]) ?? [])
  const existingPaymentsById = new Map(existing?.payments.map((row) => [row._id.toString(), row]) ?? [])

  function mergeRows(rows: SaveCashSheetRowInput[], existingById: Map<string, CashSheetRow>) {
    return rows.map((row) => {
      const match = row.id ? existingById.get(row.id) : undefined
      return {
        particular: row.particular,
        amount: row.amount,
        remark: row.remark,
        enteredBy: match ? match.enteredBy : admin.id,
        // A brand-new row typed directly into the admin editor is admin-authored, so it bypasses
        // review entirely; a matched row keeps whatever review state it already had.
        status: match ? match.status : 'approved',
        reviewedBy: match ? match.reviewedBy : admin.id,
        reviewedAt: match ? match.reviewedAt : new Date(),
      }
    })
  }

  await CashSheet.findOneAndUpdate(
    { date: input.date },
    {
      $set: {
        openingBalance: input.openingBalance,
        actualClosingCash: input.actualClosingCash,
        receipts: mergeRows(input.receipts, existingReceiptsById),
        payments: mergeRows(input.payments, existingPaymentsById),
        updatedBy: admin.id,
      },
      $setOnInsert: { createdBy: admin.id },
    },
    { upsert: true, runValidators: true },
  )
}

export interface MyEntryRow {
  date: string
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
  status: 'pending' | 'approved' | 'rejected'
}

interface AggregatedMyEntry extends Omit<MyEntryRow, 'status'> {
  status: 'pending' | 'approved' | 'rejected' | null
}

export async function getMyEntries(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<MyEntryRow>> {
  const session = await verifySession()
  await connectDB()

  const [result] = await CashSheet.aggregate<{ data: AggregatedMyEntry[]; total: { count: number }[] }>([
    {
      $project: {
        date: 1,
        rows: {
          $concatArrays: [
            {
              $map: {
                input: '$receipts',
                as: 'r',
                in: {
                  type: 'receipt',
                  particular: '$$r.particular',
                  amount: '$$r.amount',
                  remark: '$$r.remark',
                  enteredBy: '$$r.enteredBy',
                  status: '$$r.status',
                },
              },
            },
            {
              $map: {
                input: '$payments',
                as: 'p',
                in: {
                  type: 'payment',
                  particular: '$$p.particular',
                  amount: '$$p.amount',
                  remark: '$$p.remark',
                  enteredBy: '$$p.enteredBy',
                  status: '$$p.status',
                },
              },
            },
          ],
        },
      },
    },
    { $unwind: '$rows' },
    { $match: { 'rows.enteredBy': new mongoose.Types.ObjectId(session.userId) } },
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
              type: '$rows.type',
              particular: '$rows.particular',
              amount: '$rows.amount',
              remark: '$rows.remark',
              status: '$rows.status',
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const rows = (result?.data ?? []).map((row) => ({ ...row, status: row.status ?? 'approved' }))
  return toPaginated(rows, result?.total[0]?.count ?? 0, page, pageSize)
}

export interface AddMyEntryRowInput {
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
}

export interface AddMyEntriesInput {
  date: string
  entries: AddMyEntryRowInput[]
}

export async function addMyEntries(input: AddMyEntriesInput) {
  const session = await verifySession()
  if (!isWithinEntryWindow(input.date)) {
    throw new Error(`You can only log entries within the last ${ENTRY_BACKDATE_WINDOW_DAYS} days.`)
  }
  await connectDB()

  const actingUser = await User.findById(session.userId).select('role')
  const status = actingUser?.role === 'admin' ? 'approved' : 'pending'

  const toRow = (entry: AddMyEntryRowInput): Omit<CashSheetRow, '_id'> => ({
    particular: entry.particular,
    amount: entry.amount,
    remark: entry.remark,
    enteredBy: new mongoose.Types.ObjectId(session.userId),
    status,
    reviewedBy: status === 'approved' ? new mongoose.Types.ObjectId(session.userId) : null,
    reviewedAt: status === 'approved' ? new Date() : null,
  })

  const receiptRows = input.entries.filter((e) => e.type === 'receipt').map(toRow)
  const paymentRows = input.entries.filter((e) => e.type === 'payment').map(toRow)

  const pushOps: Record<string, unknown> = {}
  if (receiptRows.length > 0) pushOps.receipts = { $each: receiptRows }
  if (paymentRows.length > 0) pushOps.payments = { $each: paymentRows }

  const openingBalance = (await findPreviousClosingBalance(input.date)) ?? 0

  await CashSheet.findOneAndUpdate(
    { date: input.date },
    {
      ...(Object.keys(pushOps).length > 0 ? { $push: pushOps } : {}),
      $set: { updatedBy: session.userId },
      $setOnInsert: { createdBy: session.userId, openingBalance },
    },
    { upsert: true, runValidators: true },
  )
}

export interface AllEntryRow {
  id: string
  date: string
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
  enteredByName: string
  status: 'pending' | 'approved' | 'rejected'
}

interface AggregatedAllEntry extends Omit<AllEntryRow, 'enteredByName' | 'status'> {
  enteredByName: string | null
  status: 'pending' | 'approved' | 'rejected' | null
}

function entryRowsPipeline() {
  return [
    {
      $project: {
        date: 1,
        rows: {
          $concatArrays: [
            {
              $map: {
                input: '$receipts',
                as: 'r',
                in: {
                  _id: '$$r._id',
                  type: 'receipt',
                  particular: '$$r.particular',
                  amount: '$$r.amount',
                  remark: '$$r.remark',
                  enteredBy: '$$r.enteredBy',
                  status: '$$r.status',
                },
              },
            },
            {
              $map: {
                input: '$payments',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  type: 'payment',
                  particular: '$$p.particular',
                  amount: '$$p.amount',
                  remark: '$$p.remark',
                  enteredBy: '$$p.enteredBy',
                  status: '$$p.status',
                },
              },
            },
          ],
        },
      },
    },
    { $unwind: '$rows' },
  ]
}

export async function getAllEntries(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<AllEntryRow>> {
  await requireAdmin()
  await connectDB()

  const [result] = await CashSheet.aggregate<{ data: AggregatedAllEntry[]; total: { count: number }[] }>([
    ...entryRowsPipeline(),
    { $sort: { date: -1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          { $lookup: { from: 'users', localField: 'rows.enteredBy', foreignField: '_id', as: 'enteredByUser' } },
          { $unwind: { path: '$enteredByUser', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              id: { $toString: '$rows._id' },
              date: 1,
              type: '$rows.type',
              particular: '$rows.particular',
              amount: '$rows.amount',
              remark: '$rows.remark',
              enteredByName: '$enteredByUser.name',
              status: '$rows.status',
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const rows = (result?.data ?? []).map((row) => ({
    ...row,
    enteredByName: row.enteredByName ?? 'Unknown',
    status: row.status ?? ('approved' as const),
  }))
  return toPaginated(rows, result?.total[0]?.count ?? 0, page, pageSize)
}

export interface PendingEntryRow {
  id: string
  date: string
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
  enteredByName: string
}

interface AggregatedPendingEntry extends Omit<PendingEntryRow, 'enteredByName'> {
  enteredByName: string | null
}

export async function getPendingEntries(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<PendingEntryRow>> {
  await requireCheckerOrAdmin()
  await connectDB()

  const [result] = await CashSheet.aggregate<{ data: AggregatedPendingEntry[]; total: { count: number }[] }>([
    ...entryRowsPipeline(),
    { $match: { 'rows.status': 'pending' } },
    { $sort: { date: -1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          { $lookup: { from: 'users', localField: 'rows.enteredBy', foreignField: '_id', as: 'enteredByUser' } },
          { $unwind: { path: '$enteredByUser', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              id: { $toString: '$rows._id' },
              date: 1,
              type: '$rows.type',
              particular: '$rows.particular',
              amount: '$rows.amount',
              remark: '$rows.remark',
              enteredByName: '$enteredByUser.name',
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const rows = (result?.data ?? []).map((row) => ({ ...row, enteredByName: row.enteredByName ?? 'Unknown' }))
  return toPaginated(rows, result?.total[0]?.count ?? 0, page, pageSize)
}

export interface UpdateEntryInput {
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
}

export async function updateEntry(date: string, id: string, input: UpdateEntryInput) {
  const admin = await requireAdmin()
  await connectDB()

  const sheet = await CashSheet.findOne({ date })
  if (!sheet) throw new Error('Entry not found.')
  const existing = sheet.receipts.find((row) => row._id.toString() === id) ?? sheet.payments.find((row) => row._id.toString() === id)
  if (!existing) throw new Error('Entry not found.')

  const field = input.type === 'receipt' ? 'receipts' : 'payments'
  const newRow = {
    _id: existing._id,
    particular: input.particular,
    amount: input.amount,
    remark: input.remark,
    enteredBy: existing.enteredBy,
    status: existing.status,
    reviewedBy: existing.reviewedBy,
    reviewedAt: existing.reviewedAt,
  }

  await CashSheet.updateOne({ date }, { $pull: { receipts: { _id: id }, payments: { _id: id } } })
  await CashSheet.updateOne({ date }, { $push: { [field]: newRow }, $set: { updatedBy: admin.id } })
}

export async function deleteEntry(date: string, id: string) {
  const admin = await requireAdmin()
  await connectDB()

  await CashSheet.updateOne(
    { date },
    { $pull: { receipts: { _id: id }, payments: { _id: id } }, $set: { updatedBy: admin.id } },
  )
}

async function setEntryReviewStatus(date: string, id: string, status: 'approved' | 'rejected') {
  const checker = await requireCheckerOrAdmin()
  await connectDB()

  const sheet = await CashSheet.findOne({ date })
  if (!sheet) throw new Error('Entry not found.')
  const receiptMatch = sheet.receipts.find((row) => row._id.toString() === id)
  const row = receiptMatch ?? sheet.payments.find((row) => row._id.toString() === id)
  if (!row) throw new Error('Entry not found.')

  const field = receiptMatch ? 'receipts' : 'payments'
  const reviewedAt = new Date()
  await CashSheet.updateOne(
    { date, [`${field}._id`]: id },
    {
      $set: {
        [`${field}.$.status`]: status,
        [`${field}.$.reviewedBy`]: checker.id,
        [`${field}.$.reviewedAt`]: reviewedAt,
      },
    },
  )

  const type = receiptMatch ? 'receipt' : 'payment'
  await createNotification(
    row.enteredBy.toString(),
    `Your ${type} of ₹${row.amount} ("${row.particular}") on ${date} was ${status} by ${checker.name}.`,
    '/my-entries',
  )
}

export async function approveEntry(date: string, id: string) {
  await setEntryReviewStatus(date, id, 'approved')
}

export async function rejectEntry(date: string, id: string) {
  await setEntryReviewStatus(date, id, 'rejected')
}

export async function getDistinctParticulars(): Promise<string[]> {
  await verifySession()
  await connectDB()

  const [receiptValues, paymentValues] = await Promise.all([
    CashSheet.distinct('receipts.particular'),
    CashSheet.distinct('payments.particular'),
  ])

  const unique = new Set([...receiptValues, ...paymentValues].filter((value): value is string => Boolean(value)))
  return [...unique].sort((a, b) => a.localeCompare(b))
}
