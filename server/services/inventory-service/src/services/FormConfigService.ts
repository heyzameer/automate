import { injectable } from 'tsyringe';
import FormConfig, { IFormField } from '../models/FormConfig';
import { logger } from '../utils/logger';

@injectable()
export class FormConfigService {
    async getLatestConfig() {
        return await FormConfig.findOne().sort({ version: -1 });
    }

    async addField(field: IFormField, adminId: string) {
        const config = await this.getLatestConfig();
        if (!config) throw new Error('Form configuration not found');

        // Check if field name already exists
        if (config.fields.find(f => f.name === field.name)) {
            throw new Error(`Field with name '${field.name}' already exists`);
        }

        config.fields.push(field);
        config.version += 1;
        config.lastUpdatedBy = adminId;
        
        await config.save();
        logger.info(`Admin ${adminId} added new field: ${field.name}`);
        return config;
    }

    async updateField(fieldName: string, updates: Partial<IFormField>, adminId: string) {
        const config = await this.getLatestConfig();
        if (!config) throw new Error('Form configuration not found');

        const fieldIndex = config.fields.findIndex(f => f.name === fieldName);
        if (fieldIndex === -1) throw new Error(`Field '${fieldName}' not found`);

        // Update field
        config.fields[fieldIndex] = { ...config.fields[fieldIndex], ...updates };
        config.version += 1;
        config.lastUpdatedBy = adminId;

        await config.save();
        logger.info(`Admin ${adminId} updated field: ${fieldName}`);
        return config;
    }

    async updateFieldOptions(fieldName: string, options: string[], adminId: string) {
        return this.updateField(fieldName, { options }, adminId);
    }
}
