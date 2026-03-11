import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { injectable, inject } from 'tsyringe';
import { ITenantRepository } from '../interfaces/IRepository/ITenantRepository';
import { FormField } from '../models/FormField';
import { UserRole } from '../types';
import { User } from '../models/User';

@injectable()
export class SuperAdminController {
    constructor(
        @inject('TenantRepository') private tenantRepository: ITenantRepository
    ) { }

    getTenants = asyncHandler(async (req: Request, res: Response) => {
        const tenants = await this.tenantRepository.find({});
        sendSuccess(res, 'Tenants retrieved successfully', tenants);
    });

    updateTenant = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updateData = req.body;
        const tenant = await this.tenantRepository.update(id, updateData);
        sendSuccess(res, 'Tenant updated successfully', tenant);
    });

    deleteTenant = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await this.tenantRepository.delete(id);
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
        const tenantCount = await this.tenantRepository.count();
        const activeUsers = await User.countDocuments({ isActive: true });
        sendSuccess(res, 'Dashboard stats retrieved', {
            tenantCount,
            activeUsers
        });
    });
}
