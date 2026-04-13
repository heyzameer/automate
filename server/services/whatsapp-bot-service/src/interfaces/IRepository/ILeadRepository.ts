import { ILeadDocument } from '../../models/Lead';

export interface ILeadRepository {
    findById(id: string): Promise<ILeadDocument | null>;
    findOne(query: any): Promise<ILeadDocument | null>;
    find(query: any, sort?: any, limit?: number): Promise<ILeadDocument[]>;
    create(data: any): Promise<ILeadDocument>;
    update(id: string, data: any): Promise<ILeadDocument | null>;
    delete(id: string): Promise<boolean>;
    count(query: any): Promise<number>;
}
