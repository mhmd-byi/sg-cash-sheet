import 'server-only'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { DEFAULT_PAGE_SIZE, toPaginated, type Paginated } from '@/lib/pagination'
import { User } from '@/models/User'

export interface UserListItem {
  id: string
  name: string
  username: string
  email: string
  role: 'admin' | 'maker' | 'checker'
}

export async function getUsersList(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<UserListItem>> {
  await requireAdmin()
  await connectDB()

  const [users, total] = await Promise.all([
    User.find()
      .select('name username email role')
      .sort({ name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(),
  ])

  const rows = users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  }))

  return toPaginated(rows, total, page, pageSize)
}

export interface CreateUserInput {
  email: string
  username: string
  password: string
  name: string
  role: 'admin' | 'maker' | 'checker'
}

export async function createUser(input: CreateUserInput) {
  await requireAdmin()
  await connectDB()

  const email = input.email.toLowerCase().trim()
  const username = input.username.toLowerCase().trim()
  const existing = await User.findOne({ $or: [{ email }, { username }] })
  if (existing) {
    throw new Error(
      existing.email === email ? 'A user with this email already exists.' : 'This username is already taken.',
    )
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  await User.create({ email, username, passwordHash, name: input.name, role: input.role })
}

export interface UserDetail {
  id: string
  name: string
  username: string
  email: string
  role: 'admin' | 'maker' | 'checker'
}

export async function getUserById(id: string): Promise<UserDetail | null> {
  await requireAdmin()
  await connectDB()

  const user = await User.findById(id).select('name username email role').lean()
  if (!user) return null
  return { id: user._id.toString(), name: user.name, username: user.username, email: user.email, role: user.role }
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
  username: string
  email: string
  role: 'admin' | 'maker' | 'checker'
  password?: string
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await requireAdmin()
  await connectDB()

  const email = input.email.toLowerCase().trim()
  const username = input.username.toLowerCase().trim()
  const existing = await User.findOne({ $or: [{ email }, { username }], _id: { $ne: id } })
  if (existing) {
    throw new Error(
      existing.email === email ? 'A user with this email already exists.' : 'This username is already taken.',
    )
  }

  if (input.role !== 'admin') {
    await assertNotLastAdmin(id)
  }

  const update: Record<string, unknown> = { name: input.name, username, email, role: input.role }
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
