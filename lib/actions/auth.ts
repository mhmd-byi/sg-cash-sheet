'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { createSession, deleteSession } from '@/lib/session'

const LoginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
})

export interface LoginState {
  error?: string
}

const INVALID_CREDENTIALS_ERROR = 'Invalid email/username or password.'

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: INVALID_CREDENTIALS_ERROR }
  }

  await connectDB()
  const identifier = parsed.data.identifier.toLowerCase().trim()
  const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] })
  if (!user) {
    return { error: INVALID_CREDENTIALS_ERROR }
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!passwordMatches) {
    return { error: INVALID_CREDENTIALS_ERROR }
  }

  await createSession(user._id.toString())
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
