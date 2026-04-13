import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { IVehicleDocument } from '../models/Vehicle';
import FormConfig from '../models/FormConfig';
import { logger } from '../utils/logger';
import { AIService } from './AIService';
import { IInventoryService } from '../interfaces/IService/IInventoryService';
import { IVehicleRepository } from '../interfaces/IRepository/IVehicleRepository';
import { IBrandRepository, IModelRepository, IDropdownOptionRepository } from '../repositories/InventoryAuxRepositories';
import config from '../config';


@injectable()
export class InventoryService implements IInventoryService {
    constructor(
        @inject('AIService') private aiService: AIService,
        @inject('VehicleRepository') private vehicleRepository: IVehicleRepository,
        @inject('BrandRepository') private brandRepository: IBrandRepository,
        @inject('ModelRepository') private modelRepository: IModelRepository,
        @inject('DropdownOptionRepository') private dropdownRepository: IDropdownOptionRepository
    ) {}

    async getBrands() {
        return await this.brandRepository.findAll();
    }

    async getModelsByBrand(brandId: string) {
        return await this.modelRepository.findByBrand(brandId);
    }

    async getDropdownOptions(fieldName: string) {
        return await this.dropdownRepository.findByFieldName(fieldName);
    }

    async getNextCarCode(tenantId: string): Promise<string> {
        const count = await this.vehicleRepository.count({ tenantId });
        return `car${(count + 1).toString().padStart(2, '0')}`;
    }

    async getVehicles(tenantId: string, filters: any = {}) {
        const query: any = { tenantId };
        
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

        let sort: any = { createdAt: -1 };
        if (filters.sortBy) {
            const order = filters.sortOrder === 'desc' ? -1 : 1;
            if (filters.sortBy === 'price') sort = { 'attributes.price': order };
            else if (filters.sortBy === 'year') sort = { 'attributes.year_of_manufacture': order };
        }

        return await this.vehicleRepository.find(query, sort);
    }

    async getVehicleById(id: string, tenantId: string) {
        return await this.vehicleRepository.findOne({ _id: id, tenantId });
    }

    async createVehicle(data: any, images: string[], tenantId: string, userId: string) {
        await this.validateVehicleData(data);
        const aiPrice = await this.aiService.suggestPrice(data);

        const vehicleData: any = {
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
            attributes: {}, 
            createdBy: userId
        };

        const topLevelFields = [
            'purchasePrice', 'refurbishmentCost', 'otherExpenses', 'rcNumber', 
            'rcExpiry', 'insuranceExpiry', 'spin_images', 'service_history'
        ];
        
        const attributes = new Map();
        for (const [key, value] of Object.entries(data)) {
            if (!topLevelFields.includes(key)) {
                attributes.set(key, value);
            }
        }
        vehicleData.attributes = attributes;

        const vehicle = await this.vehicleRepository.create(vehicleData);
        logger.info(`Vehicle created for tenant ${tenantId} by user ${userId}`);

        const campaignUrl = process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:5005';
        axios.post(`${campaignUrl}/api/v1/campaigns/internal/new-arrival`, {
            tenantId,
            vehicle
        }, {
            headers: { 'x-internal-secret': config.internalSecret }
        }).catch(err => logger.error(`Failed to notify Campaign Service: ${err.message}`));


        return vehicle;
    }

    async updateVehicle(id: string, updates: any, newImages: string[], removedImages: string[], tenantId: string) {
        const vehicle = await this.vehicleRepository.findOne({ _id: id, tenantId });
        if (!vehicle) throw new Error('Vehicle not found');

        if (updates) {
            await this.validateVehicleData(updates, true);
            
            if (updates.status) vehicle.status = updates.status;
            if (updates.purchasePrice !== undefined) vehicle.purchasePrice = Number(updates.purchasePrice);
            if (updates.refurbishmentCost !== undefined) vehicle.refurbishmentCost = Number(updates.refurbishmentCost);
            if (updates.otherExpenses !== undefined) vehicle.otherExpenses = Number(updates.otherExpenses);
            if (updates.rcNumber !== undefined) vehicle.rcNumber = updates.rcNumber;
            if (updates.rcExpiry !== undefined) vehicle.rcExpiry = updates.rcExpiry ? new Date(updates.rcExpiry) : undefined;
            if (updates.insuranceExpiry !== undefined) vehicle.insuranceExpiry = updates.insuranceExpiry ? new Date(updates.insuranceExpiry) : undefined;
            if (updates.spin_images !== undefined) vehicle.spin_images = updates.spin_images;
            if (updates.service_history !== undefined) vehicle.service_history = updates.service_history;

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
        
        if (removedImages && removedImages.length > 0) {
            vehicle.images = vehicle.images.filter(img => !removedImages.includes(img));
        }

        return await vehicle.save();
    }

    async deleteVehicle(id: string, tenantId: string) {
        const success = await this.vehicleRepository.delete(id);
        if (!success) throw new Error('Vehicle not found');
        logger.info(`Vehicle ${id} deleted for tenant ${tenantId}`);
    }

    private async validateVehicleData(data: any, isUpdate: boolean = false) {
        const config = await FormConfig.findOne().sort({ version: -1 });
        if (!config) return;

        for (const field of config.fields) {
            const value = data[field.name];
            const isProvidedAsEmpty = value === '';
            if (field.required && ((!isUpdate && (value === undefined || value === null || value === '')) || (isUpdate && isProvidedAsEmpty))) {
                throw new Error(`Field '${field.label}' is required and cannot be empty`);
            }

            if (value !== undefined && value !== null && value !== '') {
                const currentYear = new Date().getFullYear();

                if (field.type === 'number' && isNaN(Number(value))) {
                    throw new Error(`Field '${field.label}' must be a number`);
                }

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

