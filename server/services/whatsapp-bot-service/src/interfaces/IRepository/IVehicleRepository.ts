import { IVehicleDocument } from '../../models/Vehicle';

export interface IVehicleRepository {
    findById(id: string): Promise<IVehicleDocument | null>;
    findOne(query: any): Promise<IVehicleDocument | null>;
    find(query: any, sort?: any, limit?: number): Promise<IVehicleDocument[]>;
    create(data: any): Promise<IVehicleDocument>;
    update(id: string, data: any): Promise<IVehicleDocument | null>;
    delete(id: string): Promise<boolean>;
    count(query: any): Promise<number>;
}
