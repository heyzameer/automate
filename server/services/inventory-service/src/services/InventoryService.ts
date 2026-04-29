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
        // Find all vehicles for this tenant to find the highest car code
        const vehicles = await this.vehicleRepository.find({ tenantId });
        let maxNum = 0;
        
        vehicles.forEach(v => {
            const code = v.attributes.get('car_code');
            if (code && typeof code === 'string') {
                const match = code.match(/car(\d+)/i);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNum) maxNum = num;
                }
            }
        });

        return `car${(maxNum + 1).toString().padStart(2, '0')}`;
    }

    async getVehicles(tenantId: string, filters: any = {}) {
        const query: any = { tenantId };
        
        // Handle visibility filtering
        if (filters.isDelisted !== undefined) {
            query.isDelisted = filters.isDelisted === 'true' || filters.isDelisted === true;
        } else if (filters.includeDelisted !== 'true' && filters.includeDelisted !== true) {
            // Default to only showing listed vehicles (legacy/safe behavior)
            query.isDelisted = false;
        }
        
        Object.keys(filters).forEach(key => {
            if (['brand', 'model', 'fuel_type', 'transmission', 'ownership', 'body_type'].includes(key) && filters[key]) {
                query[`attributes.${key}`] = new RegExp(filters[key], 'i');
            } else if (key === 'max_price') {
                query['attributes.price'] = { ...query['attributes.price'], $lte: Number(filters[key]) };
            } else if (key === 'min_price') {
                query['attributes.price'] = { ...query['attributes.price'], $gte: Number(filters[key]) };
            } else if (key === 'max_year') {
                query['attributes.year_of_manufacture'] = { ...query['attributes.year_of_manufacture'], $lte: Number(filters[key]) };
            } else if (key === 'min_year') {
                query['attributes.year_of_manufacture'] = { ...query['attributes.year_of_manufacture'], $gte: Number(filters[key]) };
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
            else if (filters.sortBy === 'mileage') sort = { 'attributes.km': order };
            else if (filters.sortBy === 'newest') sort = { createdAt: -1 };
        }

        return await this.vehicleRepository.find(query, sort);
    }

    async getVehicleById(id: string, tenantId: string) {
        return await this.vehicleRepository.findOne({ _id: id, tenantId });
    }

    async createVehicle(data: any, images: string[], tenantId: string, userId: string) {
        if (!images || images.length === 0) {
            throw new Error('At least one vehicle image is required');
        }

        await this.validateVehicleData(data);
        
        // Double check car code uniqueness
        const carCode = data.car_code;
        if (carCode) {
            const isAvailable = await this.isCarCodeAvailable(tenantId, carCode);
            if (!isAvailable) {
                throw new Error(`Car code '${carCode}' is already in use in your showroom. Please use a unique code.`);
            }
        }

        // Prevent duplicate registration numbers in the same showroom
        if (data.rcNumber) {
            const existing = await this.vehicleRepository.findOne({ tenantId, rcNumber: data.rcNumber });
            if (existing) {
                throw new Error(`A vehicle with RC Number '${data.rcNumber}' already exists in your inventory.`);
            }
        }

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
            'rcExpiry', 'insuranceExpiry', 'spin_images', 'service_history', 'bookingDetails'
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

        const mq = await import('../utils/rabbitmq').then(m => m.getRabbitMQ());
        await mq.publish('carbot_events', 'vehicle.created', { tenantId, vehicle });
        
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
            if (updates.bookingDetails !== undefined) vehicle.bookingDetails = updates.bookingDetails;

            for (const [key, value] of Object.entries(updates)) {
                const topLevelFields = [
                    'status', 'purchasePrice', 'refurbishmentCost', 'otherExpenses', 
                    'rcNumber', 'rcExpiry', 'insuranceExpiry', 'spin_images', 'service_history', 'bookingDetails'
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

        const updatedVehicle = await vehicle.save();
        
        const mq = await import('../utils/rabbitmq').then(m => m.getRabbitMQ());
        await mq.publish('carbot_events', 'vehicle.updated', { tenantId, vehicle: updatedVehicle });
        
        return updatedVehicle;
    }

    async deleteVehicle(id: string, tenantId: string) {
        const vehicle = await this.vehicleRepository.findOne({ _id: id, tenantId });
        if (!vehicle) throw new Error('Vehicle not found');
        
        await this.vehicleRepository.delete(id);
        
        const mq = await import('../utils/rabbitmq').then(m => m.getRabbitMQ());
        await mq.publish('carbot_events', 'vehicle.deleted', { id });
    }

    async toggleDelist(id: string, tenantId: string) {
        const vehicle = await this.vehicleRepository.findOne({ _id: id, tenantId });
        if (!vehicle) throw new Error('Vehicle not found');

        vehicle.isDelisted = !vehicle.isDelisted;
        await vehicle.save();

        // Update Search Index
        const { container } = await import('tsyringe');
        const { SearchService } = await import('./SearchService');
        const searchService = container.resolve(SearchService);
        await searchService.indexVehicle(tenantId, vehicle);

        return vehicle;
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

    async createSellRequest(data: any) {
        logger.info(`Create sell request for ${data.customerName}`);
        // Publish to rabbitmq so CRM can handle it?
        const mq = await import('../utils/rabbitmq').then(m => m.getRabbitMQ());
        await mq.publish('carbot_events', 'lead.sell_request', data);
        
        // Return dummy response for now
        return { _id: `req_${Date.now()}`, ...data };
    }

    async isCarCodeAvailable(tenantId: string, code: string): Promise<boolean> {
        const vehicle = await this.vehicleRepository.findOne({ 
            tenantId, 
            'attributes.car_code': code 
        });
        return !vehicle;
    }

    async createBrand(data: any) {
        return await this.brandRepository.create(data);
    }

    async deleteBrand(id: string) {
        return await this.brandRepository.delete(id);
    }

    async createModel(data: any) {
        return await this.modelRepository.create(data);
    }

    async deleteModel(id: string) {
        return await this.modelRepository.delete(id);
    }

    async updateDropdownOptions(fieldName: string, options: string[]) {
        return await this.dropdownRepository.update(fieldName, options);
    }
}

