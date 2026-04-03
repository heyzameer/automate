import mongoose, { Schema, Document } from 'mongoose';

export interface IDropdownOption extends Document {
  field_name: string;
  options: string[];
  updatedAt: Date;
}

const DropdownOptionSchema: Schema = new Schema({
  field_name: { 
    type: String, 
    required: true, 
    unique: true, 
    enum: ['fuel_type', 'transmission', 'ownership', 'registration_state', 'body_type'] 
  },
  options: [{ type: String, required: true }],
  updatedAt: { type: Date, default: Date.now }
});

export const DropdownOption = mongoose.model<IDropdownOption>('DropdownOption', DropdownOptionSchema);
