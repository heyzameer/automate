import { Schema, model, Document } from 'mongoose';
import { tenantPlugin } from '@carbot/common';

export interface IServiceRecord {
    date: Date;
    type: string;
    cost: number;
    notes?: string;
    receipts: string[];
}

export interface IVehicleDocument extends Document {
    tenantId: string;
    status: 'available' | 'sold' | 'reserved' | 'booked' | 'archived';
    images: string[];
    spin_images: string[]; // 360 interactive view images
    // Financials
    purchasePrice?: number;
    refurbishmentCost?: number;
    service_history: IServiceRecord[];
    otherExpenses?: number;
    sellingPrice?: number;
    aiSuggestedPrice?: number;
    // Docs
    insuranceExpiry?: Date;
    rcNumber?: string;
    rcExpiry?: Date;
    isDelisted: boolean;
    bookingDetails?: string;
    // Dynamic vehicle data (price, km, model, etc)
    attributes: Map<string, any>;
    createdBy: string;
}

const serviceRecordSchema = new Schema<IServiceRecord>({
    date: { type: Date, required: true },
    type: { type: String, required: true },
    cost: { type: Number, required: true },
    notes: { type: String },
    receipts: [{ type: String }]
}, { _id: false });

const vehicleSchema = new Schema<IVehicleDocument>({
    tenantId: { 
        type: String, 
        required: true, 
        index: true 
    },
    status: { 
        type: String, 
        enum: ['available', 'sold', 'reserved', 'booked', 'archived'], 
        default: 'available',
        index: true
    },
    images: [{ 
        type: String // Cloudinary URLs
    }],
    spin_images: [{
        type: String // Ordered images for 360 viewer
    }],
    purchasePrice: { type: Number, default: 0 },
    refurbishmentCost: { type: Number, default: 0 },
    service_history: [serviceRecordSchema],
    otherExpenses: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    aiSuggestedPrice: { type: Number },
    insuranceExpiry: { type: Date },
    rcNumber: { type: String },
    rcExpiry: { type: Date },
    isDelisted: { type: Boolean, default: false },
    bookingDetails: { type: String },
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

