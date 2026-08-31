import Link from 'next/link'
import { getCurrentUser } from '@/lib/dal'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-heading text-base font-medium">
            Cash Sheet
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/my-entries" className="text-muted-foreground hover:text-foreground">
              My Entries
            </Link>
            {isAdmin && (
              <>
                <Link href="/cash-sheets" className="text-muted-foreground hover:text-foreground">
                  Cash Sheets
                </Link>
                <Link href="/users" className="text-muted-foreground hover:text-foreground">
                  Users
                </Link>
              </>
            )}
          </nav>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </header>
      <main className="flex flex-1 flex-col p-4">{children}</main>
    </div>
  )
}
