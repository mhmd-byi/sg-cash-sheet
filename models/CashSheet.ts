import mongoose, { Schema } from 'mongoose'

export interface CashSheetRow {
  _id: mongoose.Types.ObjectId
  particular: string
  amount: number
  remark: string
  enteredBy: mongoose.Types.ObjectId
}

export interface CashSheetBase {
  date: string
  openingBalance: number
  receipts: CashSheetRow[]
  payments: CashSheetRow[]
  createdBy: mongoose.Types.ObjectId
  updatedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface CashSheetVirtuals {
  totalReceipts: number
  totalPayments: number
  closingBalance: number
}

export type CashSheetDocument = mongoose.HydratedDocument<CashSheetBase, object, object, CashSheetVirtuals>
export type CashSheetModel = mongoose.Model<CashSheetBase, object, object, CashSheetVirtuals>

const RowSchema = new Schema<CashSheetRow>({
  particular: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  remark: { type: String, trim: true, default: '' },
  enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
})

const CashSheetSchema = new Schema<CashSheetBase, CashSheetModel, object, object, CashSheetVirtuals>(
  {
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    openingBalance: { type: Number, required: true, default: 0 },
    receipts: { type: [RowSchema], default: [] },
    payments: { type: [RowSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

CashSheetSchema.virtual('totalReceipts').get(function (this: CashSheetDocument) {
  return this.receipts.reduce((sum, row) => sum + row.amount, 0)
})

CashSheetSchema.virtual('totalPayments').get(function (this: CashSheetDocument) {
  return this.payments.reduce((sum, row) => sum + row.amount, 0)
})

CashSheetSchema.virtual('closingBalance').get(function (this: CashSheetDocument) {
  return this.openingBalance + this.totalReceipts - this.totalPayments
})

export const CashSheet: CashSheetModel =
  (mongoose.models.CashSheet as CashSheetModel | undefined) ??
  mongoose.model<CashSheetBase, CashSheetModel>('CashSheet', CashSheetSchema)
