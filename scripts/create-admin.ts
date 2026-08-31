import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.ts'

async function main() {
  const [email, username, password, name] = process.argv.slice(2)

  if (!email || !username || !password || !name) {
    console.error('Usage: node --env-file=.env.local scripts/create-admin.ts <email> <username> <password> <name>')
    process.exit(1)
  }

  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable')
  }
  await mongoose.connect(MONGODB_URI)

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { username: username.toLowerCase().trim(), passwordHash, name, role: 'admin' } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )

  console.log(`Admin saved: ${user.email} / ${user.username} (${user.name})`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
