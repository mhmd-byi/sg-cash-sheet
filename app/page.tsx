import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal'

export default async function Home() {
  const user = await getCurrentUser()
  if (user?.role === 'admin') redirect('/cash-sheets')
  if (user?.role === 'checker') redirect('/approvals')
  redirect('/my-entries')
}
