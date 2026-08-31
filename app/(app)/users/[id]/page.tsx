import { notFound } from 'next/navigation'
import { getUserById } from '@/lib/users'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EditUserForm } from './edit-user-form'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserById(id)
  if (!user) notFound()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">Edit User</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
