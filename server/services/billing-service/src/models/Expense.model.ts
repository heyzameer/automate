import mongoose, { Schema, Document } from 'mongoose';

export enum ExpenseCategory {
  RENT = 'rent',
  SALARIES = 'salaries',
  UTILITY = 'utility',
  ADVERTISING = 'advertising',
  REPAIR = 'repair',
  TRANSPORT = 'transport',
  OTHER = 'other'
}

export interface IExpense extends Document {
  tenantId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  vehicleId?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  category: { 
    type: String, 
    enum: Object.values(ExpenseCategory),
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  vehicleId: { type: String, index: true },
  date: { type: Date, default: Date.now },
}, { 
  timestamps: true,
  collection: 'expenses'
});

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);
