import { DatabaseConnection } from './config/database';
import { User } from './models/User';
import { UserRole } from './types';
import { hashPassword } from './utils/helpers';
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    const email = 'superadmin@automoto.ai';
    const existing = await User.findOne({ email });

    if (!existing) {
        const password = await hashPassword('admin123');
        await User.create({
            fullName: 'System Super Admin',
            email,
            phone: '0000000000',
            password,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            isVerified: true
        });
        console.log('Super Admin created: ' + email + ' / admin123');
    } else {
        console.log('Super Admin already exists');
    }

    await db.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
