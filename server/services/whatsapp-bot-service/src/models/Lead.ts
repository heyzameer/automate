import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog {
  date: Date;
  note: string;
  agent?: string;
}

export interface ILeadDocument extends Document {
  tenantId: string;
  phone: string;
  name: string;
  vehicleId: string;
  preferredDateTime: string;
  source: string;
  stage: 'New' | 'Contacted' | 'Test Drive' | 'Negotiation' | 'Closed' | 'Lost';
  status: 'new' | 'contacted' | 'booked' | 'lost' | 'cancelled' | 'rescheduled' | 'test_drive' | 'negotiation' | 'closed' | 'completed' | 'noshow';
  score: number;
  priority: 'Cold' | 'Warm' | 'Hot';
  assignedTo?: string;
  followUpDate?: Date;
  callLogs: ICallLog[];
  historicalNames: string[];
  interestedVehicles: string[];
  historicalBookings: {
    carId: string;
    date: string;
    status: string;
  }[];
  lastActivity: Date;
}

const callLogSchema = new Schema<ICallLog>({
  date: { type: Date, default: Date.now },
  note: { type: String, required: true },
  agent: { type: String }
});

const leadSchema = new Schema<ILeadDocument>({
  tenantId: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  name: { type: String },
  vehicleId: { type: String },
  preferredDateTime: { type: String },
  source: { type: String, default: 'whatsapp' },
  stage: { type: String, enum: ['New', 'Contacted', 'Test Drive', 'Negotiation', 'Closed', 'Lost'], default: 'New' },
  status: { type: String, default: 'new' },
  score: { type: Number, default: 0 },
  priority: { type: String, enum: ['Cold', 'Warm', 'Hot'], default: 'Cold' },
  assignedTo: { type: String },
  followUpDate: { type: Date },
  callLogs: [callLogSchema],
  historicalNames: { type: [String], default: [] },
  interestedVehicles: { type: [String], default: [] },
  historicalBookings: [{
    carId: { type: String },
    date: { type: String },
    status: { type: String }
  }],
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Since leads are specific to this bot service for now, it's on the default connection
export const Lead = mongoose.model<ILeadDocument>('Lead', leadSchema);
