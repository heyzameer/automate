import { Document } from 'mongoose';
import { PlanType } from '../../types';

export interface IWhatsAppConfig {
    instanceId?: string;
    token?: string;
    isActive: boolean;
}

export interface IPlanLimits {
    maxCars: number;
    maxLeads: number;
}

export interface ITenant extends Document {
    name: string;
    slug: string; // Used for identifying the tenant in routes or headers
    plan: PlanType;
    isActive: boolean;
    expiryDate: Date;
    whatsappConfig: IWhatsAppConfig;
    limits: IPlanLimits;
    paymentNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
