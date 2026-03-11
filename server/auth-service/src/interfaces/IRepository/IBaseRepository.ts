import { Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { PaginatedResult, PaginationOptions } from '../../types';

export interface IBaseRepository<T extends Document> {
    create(data: Partial<T>): Promise<T>;
    findById(id: string, options?: QueryOptions): Promise<T | null>;
    findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null>;
    find(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
    findWithPagination(
        filter: FilterQuery<T>,
        pagination: PaginationOptions,
        populateFields?: any
    ): Promise<PaginatedResult<T>>;
    update(id: string, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
    updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<number>;
    delete(id: string): Promise<T | null>;
    deleteOne(filter: FilterQuery<T>): Promise<T | null>;
    deleteMany(filter: FilterQuery<T>): Promise<number>;
    count(filter?: FilterQuery<T>): Promise<number>;
    countDocuments(filter?: FilterQuery<T>): Promise<number>;
    exists(filter: FilterQuery<T>): Promise<boolean>;
    aggregate(pipeline: any[]): Promise<any[]>;
}
