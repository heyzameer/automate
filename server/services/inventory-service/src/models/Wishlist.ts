import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
    customerId: string;
    vehicleId: mongoose.Types.ObjectId;
    tenantId: string;
    createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
    {
        customerId: {
            type: String,
            required: true,
            index: true
        },
        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },
        tenantId: {
            type: String,
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

// Ensure a customer can only add a vehicle once to their wishlist per tenant
wishlistSchema.index({ customerId: 1, vehicleId: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
