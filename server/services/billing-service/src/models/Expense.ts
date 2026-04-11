import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  tenantId: string;
  category: 'rent' | 'salaries' | 'utility' | 'advertising' | 'repair' | 'transport' | 'other';
  amount: number;
  description: string;
  vehicleId?: string; // If linked to a specific car repair/transport
  date: Date;
}

const expenseSchema = new Schema<IExpense>({
  tenantId: { type: String, required: true, index: true },
  category: { 
    type: String, 
    enum: ['rent', 'salaries', 'utility', 'advertising', 'repair', 'transport', 'other'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  vehicleId: { type: String, index: true },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
