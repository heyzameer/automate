import mongoose, { Schema } from 'mongoose';
import { ITenant } from '../interfaces/IModel/ITenant';
import { PlanType } from '../types';

const tenantSchema = new Schema<ITenant>(
    {
        name: {
            type: String,
            required: [true, 'Tenant name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Tenant slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        plan: {
            type: String,
            enum: Object.values(PlanType),
            default: PlanType.BASIC,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        whatsappConfig: {
            instanceId: { type: String },
            token: { type: String },
            isActive: { type: Boolean, default: false },
        },
        limits: {
            maxCars: { type: Number, default: 50 },
            maxLeads: { type: Number, default: 100 },
        },
        paymentNotes: {
            type: String,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ isActive: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
