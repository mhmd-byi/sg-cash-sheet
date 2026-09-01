import { getCurrentUser } from '@/lib/dal'
import { Sidebar } from './sidebar'
import { KeyboardShortcuts } from './keyboard-shortcuts'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <KeyboardShortcuts isAdmin={isAdmin} />
      <Sidebar isAdmin={isAdmin} />
      <main className="flex flex-1 flex-col p-4">{children}</main>
    </div>
  )
}
