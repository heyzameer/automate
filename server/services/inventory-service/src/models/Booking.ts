import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
    customerId: string;
    vehicleId: mongoose.Types.ObjectId;
    tenantId: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'visited';
    bookingDate: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
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
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'visited'],
            default: 'pending'
        },
        bookingDate: {
            type: Date,
            required: true
        },
        notes: String
    },
    { timestamps: true }
);

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
