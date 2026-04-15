import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { ISystemSetting } from '../interfaces/IModel/ISystemSetting';
import { SystemSetting } from '../models/SystemSetting';
import { ISystemSettingRepository } from '../interfaces/IRepository/ISystemSettingRepository';

@injectable()
export class SystemSettingRepository extends BaseRepository<ISystemSetting> implements ISystemSettingRepository {
    constructor() {
        super(SystemSetting);
    }

    async findByIdAndUpdate(id: string, data: any, options?: any): Promise<ISystemSetting | null> {
        return this.model.findByIdAndUpdate(id, data, options).exec();
    }
}
