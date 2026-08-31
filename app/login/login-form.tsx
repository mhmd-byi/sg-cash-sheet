'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="identifier">Email or Username</FieldLabel>
          <Input id="identifier" name="identifier" type="text" autoComplete="username" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <FieldError errors={state?.error ? [{ message: state.error }] : undefined} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Logging in…' : 'Log in'}
        </Button>
      </FieldGroup>
    </form>
  )
}
