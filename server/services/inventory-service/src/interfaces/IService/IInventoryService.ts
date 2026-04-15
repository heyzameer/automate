import { IVehicleDocument } from '../../models/Vehicle';

export interface IInventoryService {
    getBrands(): Promise<any[]>;
    getModelsByBrand(brandId: string): Promise<any[]>;
    getDropdownOptions(fieldName: string): Promise<any>;
    createSellRequest(data: any): Promise<any>;
    getNextCarCode(tenantId: string): Promise<string>;
    getVehicles(tenantId: string, filters: any): Promise<IVehicleDocument[]>;
    getVehicleById(id: string, tenantId: string): Promise<IVehicleDocument | null>;
    createVehicle(data: any, images: string[], tenantId: string, userId: string): Promise<IVehicleDocument>;
    updateVehicle(id: string, updates: any, newImages: string[], removedImages: string[], tenantId: string): Promise<IVehicleDocument>;
    deleteVehicle(id: string, tenantId: string): Promise<void>;
}
