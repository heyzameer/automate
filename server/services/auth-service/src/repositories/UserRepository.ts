import { injectable } from 'tsyringe';
import { FilterQuery } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { User } from '../models/User';
import { UserRole, PaginationOptions, PaginatedResult } from '../types';
import { IUserRepository } from '../interfaces/IRepository/IUserRepository';
import { IUser } from '../interfaces/IModel/IUser';

@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return this.model.findOne({ email: email.toLowerCase() }).select('+password').exec() as Promise<IUser | null>;
    }

    async findByPhone(phone: string): Promise<IUser | null> {
        return this.model.findOne({ phone });
    }

    async findByEmailOrPhone(email: string, phone: string): Promise<IUser | null> {
        return this.model.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }],
        });
    }

    async findActiveUsers(pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
        return this.findWithPagination({ isActive: true }, pagination);
    }

    async findByRole(role: UserRole, pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
        return this.findWithPagination({ role }, pagination);
    }

    async updateLastLogin(userId: string): Promise<IUser | null> {
        return this.update(userId, { lastLoginAt: new Date() });
    }

    async searchUsers(searchTerm: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
        const filter: FilterQuery<IUser> = {
            isActive: true,
            $or: [
                { fullName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } },
            ],
        };

        return this.findWithPagination(filter, pagination);
    }

    async verifyEmail(userId: string): Promise<IUser | null> {
        return this.update(userId, {
            isVerified: true,
            emailVerifiedAt: new Date(),
        });
    }

    async verifyPhone(userId: string): Promise<IUser | null> {
        return this.update(userId, {
            phoneVerifiedAt: new Date(),
        });
    }
}
