import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'employee'], required: true, default: 'employee' },
  },
  { timestamps: true },
)

export type IUser = InferSchemaType<typeof UserSchema>

export const User = mongoose.models.User ?? mongoose.model('User', UserSchema)
