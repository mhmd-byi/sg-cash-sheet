'use client'

import { useState, type ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'

type Role = 'admin' | 'maker' | 'checker'

export function AppShell({
  role,
  unreadCount,
  children,
}: {
  role: Role
  unreadCount: number
  children: ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Header unreadCount={unreadCount} onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar role={role} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex flex-1 flex-col p-4">{children}</main>
      </div>
    </div>
  )
}
