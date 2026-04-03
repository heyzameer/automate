import { Schema, model, Document } from 'mongoose';
import { tenantPlugin } from '@carbot/common';

export interface IVehicleDocument extends Document {
    tenantId: string;
    status: 'available' | 'sold' | 'reserved' | 'archived';
    images: string[];
    // Dynamic vehicle data (price, km, model, etc)
    attributes: Map<string, any>;
    createdBy: string;
}

const vehicleSchema = new Schema<IVehicleDocument>({
    tenantId: { 
        type: String, 
        required: true, 
        index: true 
    },
    status: { 
        type: String, 
        enum: ['available', 'sold', 'reserved', 'archived'], 
        default: 'available',
        index: true
    },
    images: [{ 
        type: String // Cloudinary URLs
    }],
    attributes: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    createdBy: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true,
    minimize: false // To store empty maps
});

// Enable multi-tenant automated query isolation
vehicleSchema.plugin(tenantPlugin);

// Add index for car_code lookup
vehicleSchema.index({ tenantId: 1, 'attributes.car_code': 1 }, { unique: true, sparse: true });

const Vehicle = model<IVehicleDocument>('Vehicle', vehicleSchema);

export default Vehicle;
