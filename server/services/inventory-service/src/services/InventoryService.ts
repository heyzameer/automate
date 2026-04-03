import { injectable, inject } from 'tsyringe';
import Vehicle from '../models/Vehicle';
import FormConfig from '../models/FormConfig';
import { logger } from '../utils/logger';
import { Brand } from '../models/Brand';
import { Model } from '../models/Model';
import { DropdownOption } from '../models/DropdownOption';

@injectable()
export class InventoryService {
    async getBrands() {
        return await Brand.find({}).sort({ name: 1 });
    }

    async getModelsByBrand(brandId: string) {
        return await Model.find({ brand: brandId }).sort({ name: 1 });
    }

    async getDropdownOptions(fieldName: string) {
        return await DropdownOption.findOne({ field_name: fieldName });
    }

    async getNextCarCode(tenantId: string): Promise<string> {
        const count = await Vehicle.countDocuments({ tenantId });
        return `car${(count + 1).toString().padStart(2, '0')}`;
    }

    async getVehicles(tenantId: string, filters: any = {}) {
        const query: any = { tenantId };
        
        // Handle attribute filters (e.g., brand, fuel_type)
        if (filters.brand) query['attributes.brand'] = filters.brand;
        if (filters.model) query['attributes.model'] = filters.model;
        if (filters.status) query.status = filters.status;

        return await Vehicle.find(query).sort({ createdAt: -1 });
    }

    async getVehicleById(id: string, tenantId: string) {
        return await Vehicle.findOne({ _id: id, tenantId });
    }

    async createVehicle(data: any, images: string[], tenantId: string, userId: string) {
        // Validate against FormConfig
        await this.validateVehicleData(data);

        const vehicle = new Vehicle({
            tenantId,
            status: 'available',
            images,
            attributes: data,
            createdBy: userId
        });

        await vehicle.save();
        logger.info(`Vehicle created for tenant ${tenantId} by user ${userId}`);
        return vehicle;
    }

    async updateVehicle(id: string, updates: any, newImages: string[], removedImages: string[], tenantId: string) {
        try {
            const vehicle = await Vehicle.findOne({ _id: id, tenantId });
            if (!vehicle) throw new Error('Vehicle not found');

            if (updates) {
                // Only validate fields present in the updates
                await this.validateVehicleData(updates, true);
                
                // Handle top-level fields
                if (updates.status) vehicle.status = updates.status;

                // Sync updates into attributes Map
                for (const [key, value] of Object.entries(updates)) {
                    if (key !== 'status') {
                        vehicle.attributes.set(key, value);
                    }
                }
            }

            if (newImages && newImages.length > 0) {
                vehicle.images.push(...newImages);
            }

            if (removedImages && removedImages.length > 0) {
                vehicle.images = vehicle.images.filter(img => !removedImages.includes(img));
            }

            await vehicle.save();
            logger.info(`Vehicle ${id} successfully updated for tenant ${tenantId}`);
            return vehicle;
        } catch (error: any) {
            logger.error(`[UPDATE_VEHICLE_ERROR] id: ${id}: ${error.message}`);
            throw error;
        }
    }

    async deleteVehicle(id: string, tenantId: string) {
        const result = await Vehicle.deleteOne({ _id: id, tenantId });
        if (result.deletedCount === 0) throw new Error('Vehicle not found');
        logger.info(`Vehicle ${id} deleted for tenant ${tenantId}`);
    }

    private async validateVehicleData(data: any, isUpdate: boolean = false) {
        const config = await FormConfig.findOne().sort({ version: -1 });
        if (!config) return; // Skip validation if no config

        for (const field of config.fields) {
            const value = data[field.name];
            
            // Skip required check for update if field is missing from updates
            const isProvidedAsEmpty = value === '';
            if (field.required && ((!isUpdate && (value === undefined || value === null || value === '')) || (isUpdate && isProvidedAsEmpty))) {
                throw new Error(`Field '${field.label}' is required and cannot be empty`);
            }

            if (value !== undefined && value !== null && value !== '') {
                const currentYear = new Date().getFullYear();

                if (field.type === 'number' && isNaN(Number(value))) {
                    throw new Error(`Field '${field.label}' must be a number`);
                }

                // Domain specific validation
                if (field.name === 'manufacturing_year' || field.name === 'year_of_manufacture') {
                    const year = Number(value);
                    if (year < 1900 || year > currentYear) {
                        throw new Error(`Manufacturing Year must be between 1900 and ${currentYear}`);
                    }
                }

                if (field.name === 'registration_year') {
                    const regYear = Number(value);
                    const manuYear = Number(data['manufacturing_year'] || data['year_of_manufacture']);
                    if (regYear < 1900 || regYear > currentYear) {
                        throw new Error(`Registration Year must be between 1900 and ${currentYear}`);
                    }
                    if (manuYear && regYear < manuYear) {
                        throw new Error(`Registration Year cannot be before Manufacturing Year (${manuYear})`);
                    }
                }

                if (field.name === 'exterior_color' || field.name === 'color') {
                    if (typeof value === 'string' && (value.length > 30 || /\d/.test(value))) {
                        throw new Error(`Exterior Color must be a valid color name (no numbers, max 30 chars)`);
                    }
                }

                if (field.type === 'date' && isNaN(Date.parse(value))) {
                    throw new Error(`Field '${field.label}' must be a valid date`);
                }
            }
        }
    }
}
