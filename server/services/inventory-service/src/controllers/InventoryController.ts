import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { InventoryService } from '../services/InventoryService';
import { FormConfigService } from '../services/FormConfigService';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

@injectable()
export class InventoryController {
    constructor(
        @inject('InventoryService') private inventoryService: InventoryService,
        @inject('FormConfigService') private formService: FormConfigService
    ) { }

    // Form Configuration (Dynamic fields)
    async getFormConfig(req: Request, res: Response) {
        try {
            const config = await this.formService.getLatestConfig();
            if (!config) return sendSuccess(res, 'No config found', { config: null });

            // Dynamically inject options for specific fields
            const brands = await this.inventoryService.getBrands();
            
            // Map over fields to replace options for brand
            const fieldsWithDynamicOptions = await Promise.all(config.fields.map(async (field: any) => {
                if (field.name === 'brand') {
                    return { ...field.toObject(), options: brands.map(b => b.name) };
                }
                
                // For other dropdowns, check DropdownOption collection
                const globalOptions = ['fuel_type', 'transmission', 'ownership', 'registration_state', 'body_type'];
                if (globalOptions.includes(field.name)) {
                    const dropdown = await this.inventoryService.getDropdownOptions(field.name);
                    if (dropdown) {
                        return { ...field.toObject(), options: dropdown.options };
                    }
                }
                
                return field.toObject ? field.toObject() : field;
            }));

            return sendSuccess(res, 'Form configuration fetched', { 
                config: { ...config.toObject(), fields: fieldsWithDynamicOptions } 
            });
        } catch (error: any) {
            logger.error('[INVENTORY_CONTROLLER] Error fetching form config:', {
                message: error.message,
                stack: error.stack,
                code: error.code
            });
            res.status(500).json({ success: false, message: 'Failed to fetch form config: ' + error.message });
        }
    }

    async addFormField(req: Request, res: Response) {
        try {
            const userId = req.user?.userId || 'system';
            const config = await this.formService.addField(req.body, userId);
            return sendSuccess(res, 'New field added to global form', { config });
        } catch (error: any) {
            logger.error('Error adding field:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateFieldOptions(req: Request, res: Response) {
        try {
            const userId = req.user?.userId || 'system';
            const { fieldName } = req.params;
            const { options } = req.body;
            const config = await this.formService.updateFieldOptions(fieldName, options, userId);
            return sendSuccess(res, 'Field options updated globally', { config });
        } catch (error: any) {
            logger.error('Error updating options:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Image Management
    async uploadImages(req: Request, res: Response) {
        try {
            if (!req.files || (req.files as any[]).length === 0) {
                return res.status(400).json({ success: false, message: 'No images uploaded' });
            }
            
            const urls = (req.files as any[]).map(f => f.path);
            return sendSuccess(res, 'Images uploaded successfully', { urls });
        } catch (error: any) {
            logger.error('Error uploading images:', error);
            res.status(500).json({ success: false, message: 'Image upload failed' });
        }
    }

    // Vehicle Management
    async createVehicle(req: Request, res: Response) {
        try {
            let tenantId = req.user?.tenantId;
            const userId = req.user?.userId || 'unknown';
            
            // Allow Super Admin to specify a tenantId in the body
            if (req.user?.role === UserRole.SUPER_ADMIN && req.body.tenantId) {
                tenantId = req.body.tenantId;
            }
            
            if (!tenantId) return res.status(403).json({ success: false, message: 'Forbidden: Tenant ID required' });
            
            const { images, ...data } = req.body;
            const vehicle = await this.inventoryService.createVehicle(data, images || [], tenantId, userId);
            
            return sendSuccess(res, 'Vehicle added successfully', { vehicle });
        } catch (error: any) {
            logger.error('Error creating vehicle:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateVehicle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            let tenantId = req.user?.tenantId;
            
            // Allow Super Admin to specify a tenantId in the body/query for overrides
            if (req.user?.role === UserRole.SUPER_ADMIN && (req.body.tenantId || req.query.tenantId)) {
                tenantId = (req.body.tenantId || req.query.tenantId) as string;
            }

            if (!tenantId) return res.status(403).json({ success: false, message: 'Forbidden: Tenant ID required' });
            
            const { images, removedImages, ...data } = req.body;

            const vehicle = await this.inventoryService.updateVehicle(id, data, images || [], removedImages || [], tenantId);
            return sendSuccess(res, 'Vehicle updated successfully', { vehicle });
        } catch (error: any) {
            logger.error('Error updating vehicle:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteVehicle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            let tenantId = req.user?.tenantId;
            
            if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
                tenantId = req.query.tenantId as string;
            }

            if (!tenantId) return res.status(403).json({ success: false, message: 'Forbidden: Tenant ID required' });
            
            await this.inventoryService.deleteVehicle(id, tenantId);
            return sendSuccess(res, 'Vehicle deleted successfully');
        } catch (error: any) {
            logger.error('Error deleting vehicle:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async toggleDelist(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(403).json({ success: false, message: 'Forbidden: Tenant ID required' });

            const vehicle = await this.inventoryService.toggleDelist(id, tenantId);
            const msg = vehicle.isDelisted ? 'Vehicle delisted from bot' : 'Vehicle listed on bot';
            return sendSuccess(res, msg, { vehicle });
        } catch (error: any) {
            logger.error('Error toggling delist status:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getVehicleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            let tenantId = req.user?.tenantId;
            
            if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
                tenantId = req.query.tenantId as string;
            }

            if (!tenantId) return res.status(403).json({ success: false, message: 'Forbidden: Tenant ID required' });
            
            const vehicle = await this.inventoryService.getVehicleById(id, tenantId);
            
            if (!vehicle) {
                return res.status(404).json({ success: false, message: 'Vehicle not found' });
            }
            
            return sendSuccess(res, 'Vehicle details fetched', { vehicle });
        } catch (error: any) {
            logger.error('Error fetching vehicle by ID:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch vehicle' });
        }
    }

    async getVehicles(req: Request, res: Response) {
        try {
            let tenantId = req.user?.tenantId;
            
            if (req.user?.role === UserRole.SUPER_ADMIN && req.query.tenantId) {
                tenantId = req.query.tenantId as string;
            }

            if (!tenantId) return res.status(403).json({ success: false, message: 'Forbidden: Tenant ID required' });
            
            const vehicles = await this.inventoryService.getVehicles(tenantId, {
                ...req.query,
                includeDelisted: true
            });
            return sendSuccess(res, 'Vehicles list fetched', { vehicles });
        } catch (error: any) {
            logger.error('Error fetching vehicles:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
        }
    }

    async getBrands(req: Request, res: Response) {
        try {
            const brands = await this.inventoryService.getBrands();
            return sendSuccess(res, 'Brands fetched', { brands });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getModels(req: Request, res: Response) {
        try {
            const { brandId } = req.params;
            const models = await this.inventoryService.getModelsByBrand(brandId);
            return sendSuccess(res, 'Models fetched', { models });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getDropdownOptions(req: Request, res: Response) {
        try {
            const { fieldName } = req.params;
            const dropdown = await this.inventoryService.getDropdownOptions(fieldName);
            return sendSuccess(res, 'Dropdown options fetched', { 
                fieldName,
                options: dropdown ? dropdown.options : [] 
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getNextCarCode(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId || 'global';
            const carCode = await this.inventoryService.getNextCarCode(tenantId);
            return sendSuccess(res, 'Next car code generated', { carCode });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async checkCarCodeAvailability(req: Request, res: Response) {
        try {
            const { code } = req.params;
            const tenantId = req.user?.tenantId || 'global';
            const isAvailable = await this.inventoryService.isCarCodeAvailable(tenantId, code);
            return sendSuccess(res, 'Car code availability checked', { available: isAvailable });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // --- Admin Management Methods ---
    
    async createBrand(req: Request, res: Response) {
        try {
            const brand = await this.inventoryService.createBrand(req.body);
            return sendSuccess(res, 'Brand created successfully', { brand });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteBrand(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.inventoryService.deleteBrand(id);
            return sendSuccess(res, 'Brand deleted successfully');
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async createModel(req: Request, res: Response) {
        try {
            const model = await this.inventoryService.createModel(req.body);
            return sendSuccess(res, 'Model created successfully', { model });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteModel(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.inventoryService.deleteModel(id);
            return sendSuccess(res, 'Model deleted successfully');
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateDropdownOptions(req: Request, res: Response) {
        try {
            const { fieldName } = req.params;
            const { options } = req.body;
            const dropdown = await this.inventoryService.updateDropdownOptions(fieldName, options);
            return sendSuccess(res, 'Dropdown options updated successfully', { dropdown });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateFormField(req: Request, res: Response) {
        try {
            const { fieldName } = req.params;
            const userId = req.user?.userId || 'system';
            const config = await this.formService.updateField(fieldName, req.body, userId);
            return sendSuccess(res, 'Form field updated successfully', { config });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteFormField(req: Request, res: Response) {
        try {
            const { fieldName } = req.params;
            const userId = req.user?.userId || 'system';
            const config = await this.formService.deleteField(fieldName, userId);
            return sendSuccess(res, 'Form field deleted successfully', { config });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
