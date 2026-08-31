import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from '@/lib/session'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const session = await decrypt(cookieStore.get('session')?.value)

  if (!session?.userId) {
    redirect('/login')
  }

  return { userId: session.userId as string }
})

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await verifySession()
  await connectDB()
  const user = await User.findById(session.userId).select('name email role').lean()
  if (!user) return null
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
})

export const requireAdmin = cache(async () => {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    redirect('/my-entries')
  }
  return user
})
