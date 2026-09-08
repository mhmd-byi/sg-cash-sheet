import { getCurrentUser } from '@/lib/dal'
import { getUnreadNotificationCount } from '@/lib/notifications'
import { Sidebar } from './sidebar'
import { KeyboardShortcuts } from './keyboard-shortcuts'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, unreadCount] = await Promise.all([getCurrentUser(), getUnreadNotificationCount()])
  const role = user?.role ?? 'maker'

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <KeyboardShortcuts role={role} />
      <Sidebar role={role} unreadCount={unreadCount} />
      <main className="flex flex-1 flex-col p-4">{children}</main>
    </div>
  )
}
