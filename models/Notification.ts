import mongoose, { Schema } from 'mongoose'

export interface NotificationBase {
  userId: mongoose.Types.ObjectId
  message: string
  link: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<NotificationBase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
)

export const Notification =
  (mongoose.models.Notification as mongoose.Model<NotificationBase> | undefined) ??
  mongoose.model<NotificationBase>('Notification', NotificationSchema)
