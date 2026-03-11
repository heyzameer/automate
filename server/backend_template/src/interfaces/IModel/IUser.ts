import { Document } from 'mongoose';
import { UserRole } from '../../types';

export interface IUser extends Document {
    id: string; // From transform function
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    emailVerifiedAt?: Date;
    phoneVerifiedAt?: Date;
    profilePicture?: string;
    lastLoginAt?: Date;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
}
