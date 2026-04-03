import mongoose, { Schema, Document, Model } from 'mongoose';
import { DatabaseConnection } from '../config/database';

export interface IVehicleDocument extends Document {
  tenantId: string;
  status: 'available' | 'sold' | 'reserved' | 'archived';
  images: string[];
  attributes: Map<string, any>;
}

const vehicleSchema = new Schema<IVehicleDocument>({
  tenantId: { type: String, required: true, index: true },
  status: { type: String, index: true },
  images: [String],
  attributes: { type: Map, of: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'vehicles'
});

// Fix: Don't create the model immediately. Wait for the connection.
export const Vehicle = {
  get model(): Model<IVehicleDocument> {
    const db = DatabaseConnection.getInstance();
    const inventoryConnection = db.getInventoryConnection();
    return inventoryConnection.model<IVehicleDocument>('Vehicle', vehicleSchema);
  },
  // Add helper methods to match the standard Mongoose API
  find: (filter: any) => Vehicle.model.find(filter),
  findOne: (filter: any) => Vehicle.model.findOne(filter),
  findById: (id: any) => Vehicle.model.findById(id),
  create: (doc: any) => Vehicle.model.create(doc),
  deleteMany: (filter: any) => Vehicle.model.deleteMany(filter)
} as any;
