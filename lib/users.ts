import 'server-only'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export interface UserListItem {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
}

export async function getUsersList(): Promise<UserListItem[]> {
  await requireAdmin()
  await connectDB()

  const users = await User.find().select('name email role').sort({ name: 1 }).lean()
  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }))
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: 'admin' | 'employee'
}

export async function createUser(input: CreateUserInput) {
  await requireAdmin()
  await connectDB()

  const email = input.email.toLowerCase().trim()
  const existing = await User.findOne({ email })
  if (existing) {
    throw new Error('A user with this email already exists.')
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  await User.create({ email, passwordHash, name: input.name, role: input.role })
}
