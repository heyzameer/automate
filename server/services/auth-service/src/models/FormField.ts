import mongoose, { Schema, Document } from 'mongoose';

export interface IFormField extends Document {
    tenantId: mongoose.Types.ObjectId;
    label: string;
    name: string;
    type: 'text' | 'number' | 'email' | 'select' | 'textarea' | 'checkbox';
    required: boolean;
    options?: string[]; // For select type
    order: number;
    isActive: boolean;
}

const formFieldSchema = new Schema<IFormField>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['text', 'number', 'email', 'select', 'textarea', 'checkbox'],
            default: 'text',
        },
        required: {
            type: Boolean,
            default: false,
        },
        options: [{ type: String }],
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

formFieldSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const FormField = mongoose.model<IFormField>('FormField', formFieldSchema);
