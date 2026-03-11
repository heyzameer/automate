import { Document } from 'mongoose';

export interface ISystemSetting extends Document {
    platformName: string;
    supportPhone: string;
    platformFeePercent: number;
    taxPercent: number;
    maintenanceMode: boolean;
    autoApprovePartners: boolean;
    socialLinks: {
        github: string;
        twitter: string;
        facebook: string;
        instagram: string;
    };
    twoFactorAuth: boolean;
    createdAt: Date;
    updatedAt: Date;
}
