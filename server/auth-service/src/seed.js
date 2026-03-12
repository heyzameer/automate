const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://localhost:27017/carbot_auth';

async function seed() {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
        fullName: String,
        email: { type: String, unique: true },
        password: String,
        role: String,
        isActive: Boolean,
        isVerified: Boolean
    });

    const User = mongoose.model('User', UserSchema);

    const email = 'superadmin@automoto.ai';
    const password = 'admin123';
    
    const existing = await User.findOne({ email });
    if (existing) {
        console.log('Super Admin already exists');
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            fullName: 'Super Admin',
            email,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            isVerified: true
        });
        console.log('Super Admin created: superadmin@automoto.ai / admin123');
    }

    await mongoose.disconnect();
}

seed().catch(console.error);
