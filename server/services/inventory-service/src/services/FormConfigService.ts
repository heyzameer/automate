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

        // Use Mongoose subdocument set method
        (config.fields[fieldIndex] as any).set(updates);
        config.version += 1;
        config.lastUpdatedBy = adminId;

        await config.save();
        logger.info(`Admin ${adminId} updated field: ${fieldName}`);
        return config;
    }

    async updateFieldOptions(fieldName: string, options: string[], adminId: string) {
        return this.updateField(fieldName, { options }, adminId);
    }

    async deleteField(fieldName: string, adminId: string) {
        const config = await this.getLatestConfig();
        if (!config) throw new Error('Form configuration not found');

        const field = config.fields.find(f => f.name === fieldName);
        if (!field) {
            throw new Error(`Field '${fieldName}' not found`);
        }

        // Use Mongoose array pull method
        (config.fields as any).pull({ _id: (field as any)._id });

        config.version += 1;
        config.lastUpdatedBy = adminId;

        await config.save();
        logger.info(`Admin ${adminId} deleted field: ${fieldName}`);
        return config;
    }
}
