'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createUser as createUserDAL } from '@/lib/users'

const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().trim().min(1, 'Name is required.'),
  role: z.enum(['admin', 'employee']),
})

export interface CreateUserResult {
  success: boolean
  error?: string
}

export async function createUser(_prevState: CreateUserResult | undefined, formData: FormData): Promise<CreateUserResult> {
  const parsed = CreateUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await createUserDAL(parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create user.' }
  }

  revalidatePath('/users')
  return { success: true }
}
