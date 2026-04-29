import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    email: string;
    phone: string;
    fullName: string;
    tenantId: string; // The showroom they registered through
    isVerified: boolean;
    wishlist: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        tenantId: {
            type: String,
            required: true,
            index: true
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        wishlist: [{
            type: Schema.Types.ObjectId,
            ref: 'Vehicle' // Reference will be handled across services via ID
        }]
    },
    { timestamps: true }
);

// Unique email per showroom (tenant)
customerSchema.index({ email: 1, tenantId: 1 }, { unique: true });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
