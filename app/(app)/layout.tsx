import { getCurrentUser } from '@/lib/dal'
import { getUnreadNotificationCount } from '@/lib/notifications'
import { AppShell } from './app-shell'
import { KeyboardShortcuts } from './keyboard-shortcuts'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, unreadCount] = await Promise.all([getCurrentUser(), getUnreadNotificationCount()])
  const role = user?.role ?? 'maker'

  return (
    <>
      <KeyboardShortcuts role={role} />
      <AppShell role={role} unreadCount={unreadCount}>
        {children}
      </AppShell>
    </>
  )
}
