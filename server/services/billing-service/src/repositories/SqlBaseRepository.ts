import { Repository, DeepPartial, FindOptionsWhere, FindManyOptions } from 'typeorm';

export interface ISqlBaseRepository<T> {
  create(data: DeepPartial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filter: FindOptionsWhere<T>): Promise<T | null>;
  find(filter: FindOptionsWhere<T>, options?: FindManyOptions<T>): Promise<T[]>;
  update(id: string, data: DeepPartial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter: FindOptionsWhere<T>): Promise<number>;
}

export abstract class SqlBaseRepository<T extends { id: string }> implements ISqlBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity as any);
  }

  async findById(id: string): Promise<T | null> {
    return await this.repository.findOne({ where: { id } as any });
  }

  async findOne(filter: FindOptionsWhere<T>): Promise<T | null> {
    return await this.repository.findOne({ where: filter });
  }

  async find(filter: FindOptionsWhere<T>, options: FindManyOptions<T> = {}): Promise<T[]> {
    return await this.repository.find({ ...options, where: filter });
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async count(filter: FindOptionsWhere<T>): Promise<number> {
    return await this.repository.count({ where: filter });
  }
}
