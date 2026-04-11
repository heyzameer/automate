import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleSellRequest extends Document {
    tenantId: string;
    customerName: string;
    customerPhone: string;
    carDetails: {
        brand: string;
        model: string;
        year: number;
        fuelType: string;
        kmsDriven: number;
        expectedPrice: number;
    };
    status: 'pending' | 'evaluated' | 'purchased' | 'rejected';
    notes?: string;
}

const sellRequestSchema = new Schema<IVehicleSellRequest>({
    tenantId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    carDetails: {
        brand: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: Number, required: true },
        fuelType: { type: String, required: true },
        kmsDriven: { type: Number, required: true },
        expectedPrice: { type: Number, required: true }
    },
    status: { type: String, enum: ['pending', 'evaluated', 'purchased', 'rejected'], default: 'pending' },
    notes: { type: String }
}, {
    timestamps: true
});

export const SellRequest = mongoose.model<IVehicleSellRequest>('SellRequest', sellRequestSchema);
