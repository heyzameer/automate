const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://localhost:27017/carbot_auth';

async function verify() {
    await mongoose.connect(uri);
    
    const UserSchema = new mongoose.Schema({
        email: String,
        password: { type: String, select: true }
    });
    const User = mongoose.model('User', UserSchema);

    const email = 'superadmin@automoto.ai';
    const password = 'admin123';
    
    const user = await User.findOne({ email });
    if (!user) {
        console.log('User not found');
    } else {
        console.log('User found, hash:', user.password);
        const match = await bcrypt.compare(password, user.password);
        console.log('Password match:', match);
    }

    await mongoose.disconnect();
}

verify().catch(console.error);
