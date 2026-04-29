import { injectable } from 'tsyringe';
import { Brand } from '../models/Brand';
import { Model } from '../models/Model';
import { DropdownOption } from '../models/DropdownOption';

export interface IBrandRepository {
    findAll(): Promise<any[]>;
    create(data: any): Promise<any>;
    delete(id: string): Promise<void>;
}

export interface IModelRepository {
    findByBrand(brandId: string): Promise<any[]>;
    create(data: any): Promise<any>;
    delete(id: string): Promise<void>;
}

export interface IDropdownOptionRepository {
    findByFieldName(fieldName: string): Promise<any>;
    update(fieldName: string, options: string[]): Promise<any>;
}

@injectable()
export class BrandRepository implements IBrandRepository {
    async findAll() { return await Brand.find({}).sort({ name: 1 }); }
    async create(data: any) { return await Brand.create(data); }
    async delete(id: string) { await Brand.findByIdAndDelete(id); }
}

@injectable()
export class ModelRepository implements IModelRepository {
    async findByBrand(brandId: string) { return await Model.find({ brand: brandId }).sort({ name: 1 }); }
    async create(data: any) { return await Model.create(data); }
    async delete(id: string) { await Model.findByIdAndDelete(id); }
}

@injectable()
export class DropdownOptionRepository implements IDropdownOptionRepository {
    async findByFieldName(fieldName: string) { return await DropdownOption.findOne({ field_name: fieldName }); }
    async update(fieldName: string, options: string[]) { 
        return await DropdownOption.findOneAndUpdate(
            { field_name: fieldName },
            { $set: { options, updatedAt: new Date() } },
            { upsert: true, new: true }
        );
    }
}
