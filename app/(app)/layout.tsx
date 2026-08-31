import { getCurrentUser } from '@/lib/dal'
import { Sidebar } from './sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex flex-1 flex-col p-4">{children}</main>
    </div>
  )
}
