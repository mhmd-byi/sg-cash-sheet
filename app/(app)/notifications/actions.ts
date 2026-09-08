'use server'

import { revalidatePath } from 'next/cache'
import { markAllNotificationsRead as markAllNotificationsReadDAL } from '@/lib/notifications'

export async function markAllNotificationsRead() {
  await markAllNotificationsReadDAL()
  revalidatePath('/notifications')
}
