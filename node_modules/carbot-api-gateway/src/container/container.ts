import 'reflect-metadata';
import { container } from 'tsyringe';

// Repository interfaces
import { IUserRepository } from '../interfaces/IRepository/IUserRepository';
import { IOTPRepository } from '../interfaces/IRepository/IOTPRepository';
import { ISystemSettingRepository } from '../interfaces/IRepository/ISystemSettingRepository';

// Service interfaces
import { IAuthService } from '../interfaces/IService/IAuthService';

// Implementations
import { UserRepository } from '../repositories/UserRepository';
import { OTPRepository } from '../repositories/OTPRepository';
import { SystemSettingRepository } from '../repositories/SystemSettingRepository';
import { AuthService } from '../services/AuthService';

// Controllers
import { AuthController } from '../controllers/AuthController';

// Register repositories
container.registerSingleton<IUserRepository>('UserRepository', UserRepository);
container.registerSingleton<IOTPRepository>('OTPRepository', OTPRepository);
container.registerSingleton<ISystemSettingRepository>('SystemSettingRepository', SystemSettingRepository);

// Register services
container.registerSingleton<IAuthService>('AuthService', AuthService);

// Register controllers
container.registerSingleton(AuthController);

export { container };
