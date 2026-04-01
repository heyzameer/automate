import { Schema, model } from 'mongoose';
import { ISystemSetting } from '../interfaces/IModel/ISystemSetting';

const systemSettingSchema = new Schema<ISystemSetting>(
    {
        platformName: { type: String, default: 'MyPlatform' },
        supportPhone: { type: String, default: '+1 (555) 000-0000' },
        platformFeePercent: { type: Number, default: 10 },
        taxPercent: { type: Number, default: 5 },
        maintenanceMode: { type: Boolean, default: false },
        autoApprovePartners: { type: Boolean, default: false },
        socialLinks: {
            github: { type: String, default: '' },
            twitter: { type: String, default: '' },
            facebook: { type: String, default: '' },
            instagram: { type: String, default: '' },
        },
        twoFactorAuth: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

export const SystemSetting = model<ISystemSetting>('SystemSetting', systemSettingSchema);
