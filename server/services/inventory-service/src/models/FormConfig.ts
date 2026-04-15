import { Schema, model, Document } from 'mongoose';
import { tenantPlugin } from '@carbot/common';

export interface IFormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean';
    options?: string[]; // For select type
    required: boolean;
    defaultValue?: any;
    placeholder?: string;
    order: number;
    isActive: boolean;
    category?: 'basic' | 'technical' | 'pricing' | 'other';
}

export interface IFormConfigDocument extends Document {
    version: number;
    fields: IFormField[];
    lastUpdatedBy: string;
}

const formFieldSchema = new Schema<IFormField>({
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['text', 'number', 'select', 'date', 'boolean'] 
    },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    defaultValue: { type: Schema.Types.Mixed },
    placeholder: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    category: { 
        type: String, 
        default: 'other',
        enum: ['basic', 'technical', 'pricing', 'other']
    }
});

const formConfigSchema = new Schema<IFormConfigDocument>({
    version: { type: Number, default: 1 },
    fields: [formFieldSchema],
    lastUpdatedBy: { type: String, required: true }
}, {
    timestamps: true
});

// Note: FormConfig is GLOBAL, so we DON'T apply the tenant plugin here.
// Admins manage this globally for all showrooms.

const FormConfig = model<IFormConfigDocument>('FormConfig', formConfigSchema);

export default FormConfig;
