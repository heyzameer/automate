import { injectable } from 'tsyringe';
import { Brand } from '../models/Brand';
import { Model } from '../models/Model';
import { DropdownOption } from '../models/DropdownOption';

export interface IBrandRepository {
    findAll(): Promise<any[]>;
}

export interface IModelRepository {
    findByBrand(brandId: string): Promise<any[]>;
}

export interface IDropdownOptionRepository {
    findByFieldName(fieldName: string): Promise<any>;
}

@injectable()
export class BrandRepository implements IBrandRepository {
    async findAll() { return await Brand.find({}).sort({ name: 1 }); }
}

@injectable()
export class ModelRepository implements IModelRepository {
    async findByBrand(brandId: string) { return await Model.find({ brand: brandId }).sort({ name: 1 }); }
}

@injectable()
export class DropdownOptionRepository implements IDropdownOptionRepository {
    async findByFieldName(fieldName: string) { return await DropdownOption.findOne({ field_name: fieldName }); }
}
