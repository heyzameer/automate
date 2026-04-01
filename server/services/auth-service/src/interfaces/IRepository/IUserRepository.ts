import { IUser } from '../IModel/IUser';
import { IBaseRepository } from './IBaseRepository';
import { PaginationOptions, PaginatedResult, UserRole } from '../../types';

export interface IUserRepository extends IBaseRepository<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByPhone(phone: string): Promise<IUser | null>;
    findByEmailOrPhone(email: string, phone: string): Promise<IUser | null>;
    findActiveUsers(pagination: PaginationOptions): Promise<PaginatedResult<IUser>>;
    findByRole(role: UserRole, pagination: PaginationOptions): Promise<PaginatedResult<IUser>>;
    updateLastLogin(userId: string): Promise<IUser | null>;
    searchUsers(searchTerm: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>>;
    verifyEmail(userId: string): Promise<IUser | null>;
    verifyPhone(userId: string): Promise<IUser | null>;
}
