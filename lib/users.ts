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

export interface UserDetail {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
}

export async function getUserById(id: string): Promise<UserDetail | null> {
  await requireAdmin()
  await connectDB()

  const user = await User.findById(id).select('name email role').lean()
  if (!user) return null
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
}

async function assertNotLastAdmin(id: string) {
  const user = await User.findById(id).select('role')
  if (user?.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' })
    if (adminCount <= 1) {
      throw new Error('Cannot remove admin access from the last remaining admin.')
    }
  }
}

export interface UpdateUserInput {
  name: string
  email: string
  role: 'admin' | 'employee'
  password?: string
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await requireAdmin()
  await connectDB()

  const email = input.email.toLowerCase().trim()
  const existing = await User.findOne({ email, _id: { $ne: id } })
  if (existing) {
    throw new Error('A user with this email already exists.')
  }

  if (input.role === 'employee') {
    await assertNotLastAdmin(id)
  }

  const update: Record<string, unknown> = { name: input.name, email, role: input.role }
  if (input.password) {
    update.passwordHash = await bcrypt.hash(input.password, 10)
  }

  await User.findByIdAndUpdate(id, { $set: update }, { runValidators: true })
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin()
  await connectDB()

  if (admin.id === id) {
    throw new Error('You cannot delete your own account.')
  }

  await assertNotLastAdmin(id)
  await User.findByIdAndDelete(id)
}
