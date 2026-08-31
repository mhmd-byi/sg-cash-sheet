import mongoose from 'mongoose'
import { StockItem } from '../models/StockItem.ts'

const CATEGORIES = ['Ring', 'Bangles', 'Tops', 'Pendant', 'Bracelet', 'G-Ring', 'Bali', 'P Set', 'Chains', 'Har', 'Mangalsutra']

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable')
  }
  await mongoose.connect(MONGODB_URI)

  for (const [index, name] of CATEGORIES.entries()) {
    await StockItem.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, sortOrder: index } },
      { upsert: true, runValidators: true },
    )
  }

  console.log(`Seeded ${CATEGORIES.length} stock item categories.`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
