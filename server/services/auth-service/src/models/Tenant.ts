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
            required: false,
            unique: true,
            lowercase: true,
            trim: true,
        },
        plan: {
            type: String,
            enum: Object.values(PlanType),
            default: PlanType.NONE,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        whatsappConfig: {
            phoneNumberId: { type: String },
            accessToken: { type: String },
            verifyToken: { type: String },
            isActive: { type: Boolean, default: false },
            botEnabled: { type: Boolean, default: true },
            greetingMessage: { type: String, default: "Hi 👋\nThanks for contacting us." },
            includeGallery: { type: Boolean, default: true },
            includeSpecs: { type: Boolean, default: true },
            includeLocation: { type: Boolean, default: true },
            websiteLinkTemplate: { type: String, default: "" },
        },
        kioskConfig: {
            kioskKey: { type: String, unique: true, sparse: true },
            isActive: { type: Boolean, default: false },
            allowedDomains: [{ type: String }],
            websiteUrl: { type: String, trim: true }
        },
        limits: {
            maxCars: { type: Number, default: 50 },
        },
        features: {
            whatsappBot: { type: Boolean, default: false },
            campaigns: { type: Boolean, default: false },
            qrCode: { type: Boolean, default: false },
        },
        address: { type: String, trim: true },
        locationUrl: { type: String, trim: true },
        paymentRequests: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            amount: { type: Number, required: true },
            note: { type: String },
            status: { type: String, enum: ['pending', 'paid', 'verified', 'rejected'], default: 'pending' },
            screenshotUrl: { type: String },
            createdAt: { type: Date, default: Date.now },
            paidAt: { type: Date },
            rejectReason: { type: String },
        }],
        paymentNotes: { type: String },
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
