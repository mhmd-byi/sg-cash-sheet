'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { createSession, deleteSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export interface LoginState {
  error?: string
}

const INVALID_CREDENTIALS_ERROR = 'Invalid email or password.'

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: INVALID_CREDENTIALS_ERROR }
  }

  await connectDB()
  const user = await User.findOne({ email: parsed.data.email.toLowerCase().trim() })
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
