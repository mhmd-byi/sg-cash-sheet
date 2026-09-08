'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'admin' | 'maker' | 'checker'

const COMMON_GO_TO_ROUTES: Record<string, string> = {
  h: '/',
  e: '/my-entries',
  t: '/my-stock-entries',
  n: '/notifications',
}

const CHECKER_GO_TO_ROUTES: Record<string, string> = {
  a: '/approvals',
}

const ADMIN_GO_TO_ROUTES: Record<string, string> = {
  d: '/dashboard',
  c: '/cash-sheets',
  s: '/stock-sheets',
  i: '/stock-items',
  u: '/users',
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function KeyboardShortcuts({ role }: { role: Role }) {
  const router = useRouter()
  const awaitingGoTo = useRef(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return

      if (awaitingGoTo.current) {
        awaitingGoTo.current = false
        const key = event.key.toLowerCase()
        const roleRoutes = role === 'admin' ? { ...ADMIN_GO_TO_ROUTES, ...CHECKER_GO_TO_ROUTES } : role === 'checker' ? CHECKER_GO_TO_ROUTES : {}
        const route = COMMON_GO_TO_ROUTES[key] ?? roleRoutes[key]
        if (route) {
          event.preventDefault()
          router.push(route)
        }
        return
      }

      if (event.key === 'g') {
        awaitingGoTo.current = true
        window.setTimeout(() => {
          awaitingGoTo.current = false
        }, 1500)
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        router.push('/shortcuts')
        return
      }

      if (event.key === '/') {
        event.preventDefault()
        document.getElementById('global-search-input')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [role, router])

  return null
}
