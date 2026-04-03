import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { injectable, inject } from 'tsyringe';
import { ITenantRepository } from '../interfaces/IRepository/ITenantRepository';
import { FormField } from '../models/FormField';
import { UserRole } from '../types';
import { User } from '../models/User';
import mongoose from 'mongoose';

@injectable()
export class SuperAdminController {
    constructor(
        @inject('TenantRepository') private _tenantRepository: ITenantRepository
    ) { }

    getTenants = asyncHandler(async (req: Request, res: Response) => {
        const tenants = await this._tenantRepository.find({});
        sendSuccess(res, 'Tenants retrieved successfully', tenants);
    });

    createTenant = asyncHandler(async (req: Request, res: Response) => {
        const tenantData = req.body;
        // Default expiry in 1 year
        if (!tenantData.expiryDate) {
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            tenantData.expiryDate = expiry;
        }
        
        const tenant = await this._tenantRepository.create(tenantData);
        sendSuccess(res, 'Showroom onboarded successfully', tenant);
    });

    updateTenant = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updateData = req.body;
        const tenant = await this._tenantRepository.update(id, updateData);
        sendSuccess(res, 'Tenant updated successfully', tenant);
    });

    assignBot = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { phoneNumberId, accessToken, verifyToken } = req.body;
        
        const updateData = {
            'whatsappConfig.phoneNumberId': phoneNumberId,
            'whatsappConfig.accessToken': accessToken,
            'whatsappConfig.verifyToken': verifyToken,
            'whatsappConfig.isActive': true
        };

        const tenant = await this._tenantRepository.update(id, updateData);
        sendSuccess(res, 'Bot assigned to showroom successfully', tenant);
    });

    getLeads = asyncHandler(async (req: Request, res: Response) => {
        // Accessing Lead model via dynamic registration to avoid circular dependency
        const Lead = mongoose.model('Lead'); 
        const leads = await Lead.find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('tenantId', 'name');
            
        sendSuccess(res, 'Platform leads retrieved', leads);
    });

    deleteTenant = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await this._tenantRepository.delete(id);
        sendSuccess(res, 'Tenant deleted successfully');
    });

    getTenantFormFields = asyncHandler(async (req: Request, res: Response) => {
        const { tenantId } = req.params;
        const fields = await FormField.find({ tenantId });
        sendSuccess(res, 'Form fields retrieved successfully', fields);
    });

    saveFormField = asyncHandler(async (req: Request, res: Response) => {
        const { tenantId } = req.params;
        const fieldData = req.body;
        const field = await FormField.findOneAndUpdate(
            { tenantId, name: fieldData.name },
            { ...fieldData, tenantId },
            { upsert: true, new: true }
        );
        sendSuccess(res, 'Form field saved successfully', field);
    });

    getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
        const tenantCount = await this._tenantRepository.count();
        const activeUsers = await User.countDocuments({ isActive: true });
        sendSuccess(res, 'Dashboard stats retrieved', {
            tenantCount,
            activeUsers
        });
    });
}
