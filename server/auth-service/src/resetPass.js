const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://localhost:27017/carbot_auth';

async function resetPassword() {
    await mongoose.connect(uri);
    
    // Minimal User Schema
    const UserSchema = new mongoose.Schema({
        email: String,
        password: String
    });
    const User = mongoose.model('User', UserSchema);

    const email = 'superadmin@automoto.ai';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await User.updateOne({ email }, { password: hashedPassword });
    
    if (result.modifiedCount > 0) {
        console.log(`Password reset successfully for ${email}`);
    } else {
        console.log(`User ${email} not found or password already matches.`);
    }

    await mongoose.disconnect();
}

resetPassword().catch(console.error);
