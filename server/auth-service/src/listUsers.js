const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/carbot_auth';

async function listUsers() {
    await mongoose.connect(uri);
    const UserSchema = new mongoose.Schema({
        fullName: String,
        email: String,
        role: String,
        tenantId: String
    });
    const User = mongoose.model('User', UserSchema);
    const users = await User.find({});
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
}

listUsers().catch(console.error);
