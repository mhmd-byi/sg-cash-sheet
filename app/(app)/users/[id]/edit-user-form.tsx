'use client'

import { useActionState } from 'react'
import { updateUser } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import type { UserDetail } from '@/lib/users'

export function EditUserForm({ user }: { user: UserDetail }) {
  const updateUserWithId = updateUser.bind(null, user.id)
  const [state, formAction, pending] = useActionState(updateUserWithId, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" name="name" defaultValue={user.name} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" name="email" type="email" defaultValue={user.email} required />
      </Field>
      <Field>
        <FieldLabel htmlFor="role">Role</FieldLabel>
        <select
          id="role"
          name="role"
          required
          defaultValue={user.role}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor="password">New Password</FieldLabel>
        <Input id="password" name="password" type="password" minLength={8} />
        <FieldDescription>Leave blank to keep the current password.</FieldDescription>
      </Field>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
