'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from './global-search'
import { NotificationBell } from './notification-bell'

export function Header({ unreadCount, onMenuClick }: { unreadCount: number; onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="md:hidden"
      >
        <Menu />
      </Button>
      <Link href="/" className="shrink-0 font-heading text-base font-medium">
        Cash Sheet
      </Link>
      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>
      <NotificationBell unreadCount={unreadCount} />
    </header>
  )
}
