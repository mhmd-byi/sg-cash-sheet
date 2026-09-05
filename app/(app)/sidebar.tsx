'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarContent({
  links,
  pathname,
  onNavigate,
  onClose,
}: {
  links: NavLink[]
  pathname: string
  onNavigate?: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="font-heading text-base font-medium">
          Cash Sheet
        </Link>
        {onClose && (
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X />
          </Button>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'rounded-md px-3 py-2 text-sm',
              isActive(pathname, link.href)
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-2 border-t p-3">
        <Link
          href="/shortcuts"
          onClick={onNavigate}
          className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          ⌨ Keyboard Shortcuts
        </Link>
        <form action={logout}>
          <Button type="submit" variant="destructive" size="sm" className="w-full">
            Log out
          </Button>
        </form>
      </div>
    </div>
  )
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links: NavLink[] = [
    { href: '/my-entries', label: 'My Entries' },
    { href: '/my-stock-entries', label: 'My Stock Entries' },
    ...(isAdmin
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/cash-sheets', label: 'Cash Sheets' },
          { href: '/stock-sheets', label: 'Stock Sheets' },
          { href: '/stock-items', label: 'Stock Items' },
          { href: '/users', label: 'Users' },
        ]
      : []),
  ]

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        <Link href="/" className="font-heading text-base font-medium">
          Cash Sheet
        </Link>
        <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r bg-background">
            <SidebarContent links={links} pathname={pathname} onNavigate={() => setIsOpen(false)} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:self-start md:border-r">
        <SidebarContent links={links} pathname={pathname} />
      </div>
    </>
  )
}
