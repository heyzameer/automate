import { ISystemSetting } from '../IModel/ISystemSetting';
import { IBaseRepository } from './IBaseRepository';

export interface ISystemSettingRepository extends IBaseRepository<ISystemSetting> {
    findByIdAndUpdate(id: string, data: any, options?: any): Promise<ISystemSetting | null>;
}
