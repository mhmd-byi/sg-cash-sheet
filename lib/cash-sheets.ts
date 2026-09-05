import 'server-only'
import mongoose from 'mongoose'
import { verifySession, requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { isWithinEntryWindow, ENTRY_BACKDATE_WINDOW_DAYS } from '@/lib/date'
import { CashSheet, type CashSheetRow } from '@/models/CashSheet'

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
}

export interface CashSheetDetail {
  date: string
  openingBalance: number
  receipts: CashSheetRowDTO[]
  payments: CashSheetRowDTO[]
  totalReceipts: number
  totalPayments: number
  closingBalance: number
}

export async function getCashSheetsList(): Promise<CashSheetListItem[]> {
  await requireAdmin()
  await connectDB()

  const sheets = await CashSheet.find()
    .sort({ date: -1 })
    .populate<{ updatedBy: { name: string } }>('updatedBy', 'name')

  return sheets.map((sheet) => ({
    date: sheet.date,
    openingBalance: sheet.openingBalance,
    totalReceipts: sheet.totalReceipts,
    totalPayments: sheet.totalPayments,
    closingBalance: sheet.closingBalance,
    updatedByName: sheet.updatedBy?.name ?? 'Unknown',
    updatedAt: sheet.updatedAt.toISOString(),
  }))
}

type PopulatedRow = Omit<CashSheetRow, 'enteredBy'> & { enteredBy: { name: string } | null }

function toRowDTO(row: PopulatedRow): CashSheetRowDTO {
  return {
    id: row._id.toString(),
    particular: row.particular,
    amount: row.amount,
    remark: row.remark,
    enteredByName: row.enteredBy?.name ?? 'Unknown',
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
    receipts: sheet.receipts.map(toRowDTO),
    payments: sheet.payments.map(toRowDTO),
    totalReceipts: sheet.totalReceipts,
    totalPayments: sheet.totalPayments,
    closingBalance: sheet.closingBalance,
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
      }
    })
  }

  await CashSheet.findOneAndUpdate(
    { date: input.date },
    {
      $set: {
        openingBalance: input.openingBalance,
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
}

export async function getMyEntries(): Promise<MyEntryRow[]> {
  const session = await verifySession()
  await connectDB()

  return CashSheet.aggregate<MyEntryRow>([
    {
      $project: {
        date: 1,
        rows: {
          $concatArrays: [
            {
              $map: {
                input: '$receipts',
                as: 'r',
                in: { type: 'receipt', particular: '$$r.particular', amount: '$$r.amount', remark: '$$r.remark', enteredBy: '$$r.enteredBy' },
              },
            },
            {
              $map: {
                input: '$payments',
                as: 'p',
                in: { type: 'payment', particular: '$$p.particular', amount: '$$p.amount', remark: '$$p.remark', enteredBy: '$$p.enteredBy' },
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
      $project: {
        _id: 0,
        date: 1,
        type: '$rows.type',
        particular: '$rows.particular',
        amount: '$rows.amount',
        remark: '$rows.remark',
      },
    },
  ])
}

export interface AddMyEntryInput {
  date: string
  type: 'receipt' | 'payment'
  particular: string
  amount: number
  remark: string
}

export async function addMyEntry(input: AddMyEntryInput) {
  const session = await verifySession()
  if (!isWithinEntryWindow(input.date)) {
    throw new Error(`You can only log entries within the last ${ENTRY_BACKDATE_WINDOW_DAYS} days.`)
  }
  await connectDB()

  const date = input.date
  const row: Omit<CashSheetRow, '_id'> = {
    particular: input.particular,
    amount: input.amount,
    remark: input.remark,
    enteredBy: new mongoose.Types.ObjectId(session.userId),
  }

  const update =
    input.type === 'receipt' ? { $push: { receipts: row } as const } : { $push: { payments: row } as const }
  const openingBalance = (await findPreviousClosingBalance(date)) ?? 0

  await CashSheet.findOneAndUpdate(
    { date },
    {
      ...update,
      $set: { updatedBy: session.userId },
      $setOnInsert: { createdBy: session.userId, openingBalance },
    },
    { upsert: true, runValidators: true },
  )
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
