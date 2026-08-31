'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createUser as createUserDAL,
  updateUser as updateUserDAL,
  deleteUser as deleteUserDAL,
} from '@/lib/users'

const UsernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, dashes and underscores.')

const CreateUserSchema = z.object({
  email: z.email(),
  username: UsernameSchema,
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
    username: formData.get('username'),
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

const UpdateUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  username: UsernameSchema,
  email: z.email(),
  role: z.enum(['admin', 'employee']),
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || value.length >= 8, {
      message: 'Password must be at least 8 characters.',
    }),
})

export interface UpdateUserResult {
  success: boolean
  error?: string
}

export async function updateUser(
  id: string,
  _prevState: UpdateUserResult | undefined,
  formData: FormData,
): Promise<UpdateUserResult> {
  const parsed = UpdateUserSchema.safeParse({
    name: formData.get('name'),
    username: formData.get('username'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await updateUserDAL(id, parsed.data)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user.' }
  }

  revalidatePath('/users')
  redirect('/users')
}

export interface DeleteUserResult {
  success: boolean
  error?: string
}

export async function deleteUser(id: string): Promise<DeleteUserResult> {
  try {
    await deleteUserDAL(id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user.' }
  }

  revalidatePath('/users')
  return { success: true }
}
