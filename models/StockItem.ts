import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const StockItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

export type IStockItem = InferSchemaType<typeof StockItemSchema>

export const StockItem = mongoose.models.StockItem ?? mongoose.model('StockItem', StockItemSchema)
