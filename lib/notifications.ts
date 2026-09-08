import 'server-only'
import { verifySession } from '@/lib/dal'
import { connectDB } from '@/lib/db'
import { DEFAULT_PAGE_SIZE, toPaginated, type Paginated } from '@/lib/pagination'
import { Notification } from '@/models/Notification'

export interface NotificationRow {
  id: string
  message: string
  link: string
  read: boolean
  createdAt: string
}

export async function createNotification(userId: string, message: string, link: string) {
  await connectDB()
  await Notification.create({ userId, message, link })
}

export async function getMyNotifications(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<Paginated<NotificationRow>> {
  const session = await verifySession()
  await connectDB()

  const [notifications, total] = await Promise.all([
    Notification.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Notification.countDocuments({ userId: session.userId }),
  ])

  const rows = notifications.map((notification) => ({
    id: notification._id.toString(),
    message: notification.message,
    link: notification.link,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  }))

  return toPaginated(rows, total, page, pageSize)
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await verifySession()
  await connectDB()

  return Notification.countDocuments({ userId: session.userId, read: false })
}

export async function markAllNotificationsRead() {
  const session = await verifySession()
  await connectDB()

  await Notification.updateMany({ userId: session.userId, read: false }, { $set: { read: true } })
}
