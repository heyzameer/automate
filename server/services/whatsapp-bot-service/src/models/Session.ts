import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionDocument extends Document {
  tenantId: string;
  phone: string;
  state: string;
  context: {
    search_filters?: {
      brand?: string;
      model?: string;
      max_price?: number;
      min_price?: number;
      fuel_type?: string;
      transmission?: string;
      year?: number;
      sort_by?: string;
    };
    current_car_id?: string;
    booking_details?: {
      date?: string;
      car_interest?: string;
    };
    results_page?: number;
    customer_name?: string;
    lead_name?: string;
    rescheduling_id?: string;
  };
  lastActive: Date;
}

const sessionSchema = new Schema<ISessionDocument>({
  tenantId: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  state: {
    type: String,
    enum: [
      'IDLE', 'MENU', 'SEARCH_BUDGET', 'SEARCH_BRAND', 'SEARCH_FUEL',
      'VIEW_RESULTS', 'CAR_DETAIL', 'BOOK_DATE', 'BOOK_CUSTOM_DATE',
      'BOOK_CONFIRM', 'AWAITING_NAME', 'RESCHEDULE_DATE'
    ],
    default: 'IDLE'
  },
  context: {
    type: Object,
    default: {}
  },
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// One session per customer per tenant
sessionSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export const Session = mongoose.model<ISessionDocument>('Session', sessionSchema);
