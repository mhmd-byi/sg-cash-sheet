import Link from 'next/link'
import { getMyNotifications } from '@/lib/notifications'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PaginationControls } from '../pagination-controls'
import { MarkAllReadButton } from './mark-all-read-button'

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const { rows: notifications, totalPages } = await getMyNotifications(page, pageSize)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-lg font-medium">Notifications</h1>
        <MarkAllReadButton />
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Message</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell className={notification.read ? 'text-muted-foreground' : 'font-medium'}>
                  <Link href={notification.link} className="underline-offset-4 hover:underline">
                    {notification.message}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <PaginationControls basePath="/notifications" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
