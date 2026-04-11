import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
  idempotencyKey: string; // To prevent duplicates
  tenantId: string;
  channel: 'whatsapp' | 'email' | 'app';
  recipient: string; // phone, email, or userId
  type: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
  retryCount: number;
}

const notificationLogSchema = new Schema<INotificationLog>({
  idempotencyKey: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  channel: { type: String, enum: ['whatsapp', 'email', 'app'], required: true },
  recipient: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  errorMessage: { type: String },
  retryCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', notificationLogSchema);
