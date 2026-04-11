import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import Vehicle, { IVehicleDocument } from '../models/Vehicle';
import FormConfig from '../models/FormConfig';
import { logger } from '../utils/logger';
import { Brand } from '../models/Brand';
import { Model } from '../models/Model';
import { DropdownOption } from '../models/DropdownOption';
import { AIService } from './AIService';

@injectable()
export class InventoryService {
    constructor(private aiService: AIService) {}

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
        
        // Handle dynamic filtering for all vehicle attributes
        Object.keys(filters).forEach(key => {
            if (['brand', 'model', 'fuel_type', 'transmission', 'ownership', 'body_type'].includes(key)) {
                query[`attributes.${key}`] = new RegExp(filters[key], 'i');
            } else if (key === 'max_price') {
                query['attributes.price'] = { $lte: Number(filters[key]) };
            } else if (key === 'min_price') {
                query['attributes.price'] = { ...query['attributes.price'], $gte: Number(filters[key]) };
            } else if (key === 'year') {
                query['attributes.year_of_manufacture'] = Number(filters[key]);
            } else if (key === 'status') {
                query.status = filters[key];
            }
        });

        // Handle sorting
        let sort: any = { createdAt: -1 };
        if (filters.sortBy) {
            const order = filters.sortOrder === 'desc' ? -1 : 1;
            if (filters.sortBy === 'price') sort = { 'attributes.price': order };
            else if (filters.sortBy === 'year') sort = { 'attributes.year_of_manufacture': order };
        }

        return await Vehicle.find(query).sort(sort).lean();
    }

    async createSellRequest(data: any) {
        const { SellRequest } = require('../models/SellRequest');
        const request = new SellRequest(data);
        return await request.save();
    }

    async getVehicleById(id: string, tenantId: string) {
        return await Vehicle.findOne({ _id: id, tenantId });
    }

    async createVehicle(data: any, images: string[], tenantId: string, userId: string) {
        // Validate against FormConfig
        await this.validateVehicleData(data);

        // Fetch AI Price Suggestion
        const aiPrice = await this.aiService.suggestPrice(data);

        const vehicle = new Vehicle({
            tenantId,
            status: 'available',
            images,
            spin_images: data.spin_images || [],
            purchasePrice: data.purchasePrice || 0,
            refurbishmentCost: data.refurbishmentCost || 0,
            service_history: data.service_history || [],
            otherExpenses: data.otherExpenses || 0,
            rcNumber: data.rcNumber,
            rcExpiry: data.rcExpiry ? new Date(data.rcExpiry) : undefined,
            insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
            aiSuggestedPrice: aiPrice,
            attributes: {}, // Will be populated below
            createdBy: userId
        });

        // Sync remaining dynamic data into attributes Map, excluding top-level fields
        const topLevelFields = [
            'purchasePrice', 'refurbishmentCost', 'otherExpenses', 'rcNumber', 
            'rcExpiry', 'insuranceExpiry', 'spin_images', 'service_history'
        ];
        
        for (const [key, value] of Object.entries(data)) {
            if (!topLevelFields.includes(key)) {
                vehicle.attributes.set(key, value);
            }
        }

        await vehicle.save();
        logger.info(`Vehicle created for tenant ${tenantId} by user ${userId}`);

        // Notify Campaign Service for New Arrival drafting (Async, don't block)
        const campaignUrl = process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:5005';
        axios.post(`${campaignUrl}/api/v1/campaigns/internal/new-arrival`, {
            tenantId,
            vehicle
        }, {
            headers: { 'x-internal-secret': 'carbot-internal-super-secret' }
        }).catch(err => logger.error(`Failed to notify Campaign Service: ${err.message}`));

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
                if (updates.purchasePrice !== undefined) vehicle.purchasePrice = Number(updates.purchasePrice);
                if (updates.refurbishmentCost !== undefined) vehicle.refurbishmentCost = Number(updates.refurbishmentCost);
                if (updates.otherExpenses !== undefined) vehicle.otherExpenses = Number(updates.otherExpenses);
                if (updates.rcNumber !== undefined) vehicle.rcNumber = updates.rcNumber;
                if (updates.rcExpiry !== undefined) vehicle.rcExpiry = updates.rcExpiry ? new Date(updates.rcExpiry) : undefined;
                if (updates.insuranceExpiry !== undefined) vehicle.insuranceExpiry = updates.insuranceExpiry ? new Date(updates.insuranceExpiry) : undefined;
                if (updates.spin_images !== undefined) vehicle.spin_images = updates.spin_images;
                if (updates.service_history !== undefined) vehicle.service_history = updates.service_history;

                // Sync updates into attributes Map
                for (const [key, value] of Object.entries(updates)) {
                    const topLevelFields = [
                        'status', 'purchasePrice', 'refurbishmentCost', 'otherExpenses', 
                        'rcNumber', 'rcExpiry', 'insuranceExpiry', 'spin_images', 'service_history'
                    ];
                    if (!topLevelFields.includes(key)) {
                        vehicle.attributes.set(key, value);
                    }
                }
            }

            if (newImages && newImages.length > 0) {
                vehicle.images.push(...newImages);
            }
            
            // Handle spin images separately if passed in newImages
            // (In this app, we usually send the full list in the updates object)

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
