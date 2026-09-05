import Link from 'next/link'
import { getUsersList } from '@/lib/users'
import { getCurrentUser } from '@/lib/dal'
import { parsePage, parsePageSize } from '@/lib/pagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { PaginationControls } from '../pagination-controls'
import { CreateUserForm } from './create-user-form'
import { DeleteUserButton } from './delete-user-button'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePage(pageParam)
  const pageSize = parsePageSize(pageSizeParam)
  const [{ rows: users, totalPages }, currentUser] = await Promise.all([getUsersList(page, pageSize), getCurrentUser()])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add a user</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link href={`/users/${user.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Edit
                  </Link>
                  {user.id !== currentUser?.id && <DeleteUserButton id={user.id} name={user.name} />}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls basePath="/users" page={page} pageSize={pageSize} totalPages={totalPages} />
    </div>
  )
}
