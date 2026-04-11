import { Document } from 'mongoose';
import { PlanType } from '../../types';

export interface IWhatsAppConfig {
    phoneNumberId?: string;
    accessToken?: string;
    verifyToken?: string;
    instanceId?: string;
    token?: string;
    isActive: boolean;
    botEnabled: boolean;
    greetingMessage?: string;
    includeGallery?: boolean;
    includeSpecs?: boolean;
    includeLocation?: boolean;
}

export interface IPlanLimits {
    maxCars: number;
    maxLeads: number;
    maxStaff: number;
    maxCampaignsPerMonth: number;
}

export interface IPlanFeatures {
    appointments: boolean;
    imageSending: boolean;
    nlpSearch: boolean;
    customWelcome: boolean;
    emailAlerts: boolean;
    analyticsLevel: 'none' | 'basic' | 'advanced' | 'full';
    prioritySupport: boolean;
    dedicatedSupport: boolean;
    emailCampaigns: boolean;
    newArrivalBroadcast: boolean;
    leadScoring: boolean;
}

export interface IPaymentRequest {
    _id?: any;
    amount: number;
    note?: string;
    status: 'pending' | 'paid' | 'rejected';
    screenshotUrl?: string;
    createdAt: Date;
    paidAt?: Date;
}

export interface ITenant extends Document {
    name: string;
    slug: string;
    plan: PlanType;
    isActive: boolean;
    expiryDate: Date;
    whatsappConfig: IWhatsAppConfig;
    limits: IPlanLimits;
    features: IPlanFeatures;
    address?: string;
    locationUrl?: string;
    paymentNotes?: string;
    paymentRequests: IPaymentRequest[];
    createdAt: Date;
    updatedAt: Date;
}
