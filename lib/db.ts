import 'server-only'
import mongoose from 'mongoose'

declare global {
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable')
}
const MONGODB_URI: string = process.env.MONGODB_URI

const cached = globalThis._mongooseCache ?? (globalThis._mongooseCache = { conn: null, promise: null })

export async function connectDB() {
  if (cached.conn) return cached.conn
  cached.promise ??= mongoose.connect(MONGODB_URI)
  cached.conn = await cached.promise
  return cached.conn
}
