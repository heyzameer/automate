import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import Vehicle, { IVehicleDocument } from '../models/Vehicle';
import { IVehicleRepository } from '../interfaces/IRepository/IVehicleRepository';

@injectable()
export class VehicleRepository extends BaseRepository<IVehicleDocument> implements IVehicleRepository {
    constructor() {
        super(Vehicle);
    }
}

