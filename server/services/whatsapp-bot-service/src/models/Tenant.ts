import mongoose, { Schema, Document } from 'mongoose';

/**
 * Tenant Read Model for WhatsApp Bot Service.
 * This connects to the 'tenants' collection in the auth database.
 * The connection is managed via a secondary connection if needed, 
 * but for this simplified setup, we assume they share the MongoDB server.
 */
export interface ITenantDocument extends Document {
  name: string;
  slug: string;
  isActive: boolean;
  whatsappConfig: {
    phoneNumberId: string;
    accessToken: string;
    instanceId?: string;
    botEnabled: boolean;
    greetingMessage: string;
  };
}

const tenantSchema = new Schema<ITenantDocument>({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  whatsappConfig: {
    phoneNumberId: { type: String, index: true },
    accessToken: { type: String },
    instanceId: { type: String },
    botEnabled: { type: Boolean, default: true },
    greetingMessage: { type: String }
  }
}, {
  timestamps: true,
  collection: 'tenants' // Ensure it points to the shared collection
});

// Create a separate connection specifically for the auth database if needed
// But here we rely on the main config.MONGO_URI pointing to the correct DB or server.
export const Tenant = mongoose.model<ITenantDocument>('Tenant', tenantSchema);
