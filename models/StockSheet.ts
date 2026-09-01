import mongoose, { Schema } from 'mongoose'

export interface StockItemCountRow {
  itemId: mongoose.Types.ObjectId
  openingBox: number
  openingPcs: number
  openingRemark: string
  closingBox: number
  closingPcs: number
  closingRemark: string
  displayPcs: number
  displayRemark: string
}

export interface StockTransferRow {
  _id: mongoose.Types.ObjectId
  type: 'receive' | 'issue'
  itemId: mongoose.Types.ObjectId
  particulars: string
  qty: number
  unit: 'box' | 'pcs' | 'grams'
  remark: string
  enteredBy: mongoose.Types.ObjectId
}

export interface StockSheetBase {
  date: string
  items: StockItemCountRow[]
  transfers: StockTransferRow[]
  createdBy: mongoose.Types.ObjectId
  updatedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ItemCountSchema = new Schema<StockItemCountRow>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'StockItem', required: true },
    openingBox: { type: Number, required: true, default: 0 },
    openingPcs: { type: Number, required: true, default: 0 },
    openingRemark: { type: String, trim: true, default: '' },
    closingBox: { type: Number, required: true, default: 0 },
    closingPcs: { type: Number, required: true, default: 0 },
    closingRemark: { type: String, trim: true, default: '' },
    displayPcs: { type: Number, required: true, default: 0 },
    displayRemark: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const TransferRowSchema = new Schema<StockTransferRow>({
  type: { type: String, enum: ['receive', 'issue'], required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'StockItem', required: true },
  particulars: { type: String, trim: true, default: '' },
  qty: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['box', 'pcs', 'grams'], required: true, default: 'pcs' },
  remark: { type: String, trim: true, default: '' },
  enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
})

const StockSheetSchema = new Schema<StockSheetBase>(
  {
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    items: { type: [ItemCountSchema], default: [] },
    transfers: { type: [TransferRowSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

export const StockSheet =
  (mongoose.models.StockSheet as mongoose.Model<StockSheetBase> | undefined) ??
  mongoose.model<StockSheetBase>('StockSheet', StockSheetSchema)
