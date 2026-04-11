import mongoose, { Schema, Document } from 'mongoose';

export interface IAppNotification extends Document {
  tenantId: string;
  userId?: string; // Specific user (agent) or everyone if null
  type: string;    // lead.assigned, car.aging, etc.
  title: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
}

const appNotificationSchema = new Schema<IAppNotification>({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const AppNotification = mongoose.model<IAppNotification>('AppNotification', appNotificationSchema);
