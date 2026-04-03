import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function seed() {
    await mongoose.connect('mongodb://localhost:27017/carbot_auth');
    
    const tenants = mongoose.connection.db.collection('tenants');
    const users = mongoose.connection.db.collection('users');

    const tenant = await tenants.findOne({ slug: 'unique-cars' });
    if (!tenant) {
        console.error('❌ Tenant "unique-cars" not found! Run showroom seed first.');
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash('admin123', 10);

    // DELETE OLD USERS TO REMOVE CONFLICTS
    await users.deleteOne({ email: 'super@carbotai.com' });
    await users.deleteOne({ email: 'admin@uniquecars.com' });

    // 1. Create Super Admin
    await users.insertOne({
        fullName: 'System Super Admin',
        email: 'super@carbotai.com',
        password: passwordHash,
        role: 'super_admin',
        isActive: true,
        isVerified: true,
        phone: 'SUPER' + Date.now().toString().slice(-5)
    });
    console.log('✅ Super Admin: super@carbotai.com / admin123');

    // 2. Create Showroom Admin
    await users.insertOne({
        fullName: 'Unique Cars Admin',
        email: 'admin@uniquecars.com',
        password: passwordHash,
        role: 'showroom_admin',
        tenantId: tenant._id,
        isActive: true,
        isVerified: true,
        phone: 'ADMIN' + Date.now().toString().slice(-5)
    });
    console.log('✅ Showroom Admin: admin@uniquecars.com / admin123');

    process.exit(0);
}

seed().catch(console.error);
