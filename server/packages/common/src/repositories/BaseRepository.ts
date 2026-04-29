import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string, tenantId?: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
  update(id: string, data: UpdateQuery<T>, tenantId?: string): Promise<T | null>;
  delete(id: string, tenantId?: string): Promise<boolean>;
  count(filter: FilterQuery<T>): Promise<number>;
}

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    const filter: any = { _id: id };
    if (tenantId) filter.tenantId = tenantId;
    return await this.model.findOne(filter).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  async find(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }

  async update(id: string, data: UpdateQuery<T>, tenantId?: string): Promise<T | null> {
    const filter: any = { _id: id };
    if (tenantId) filter.tenantId = tenantId;
    return await this.model.findOneAndUpdate(filter, data, { new: true }).exec();
  }
 
  async delete(id: string, tenantId?: string): Promise<boolean> {
    const filter: any = { _id: id };
    if (tenantId) filter.tenantId = tenantId;
    const result = await this.model.findOneAndDelete(filter).exec();
    return !!result;
  }

  async count(filter: FilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }
}
