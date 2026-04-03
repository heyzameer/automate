import mongoose from 'mongoose';
import { Tenant } from './models/Tenant';

async function cleanup() {
    // Both auth databases
    const MONGO_URI = 'mongodb://localhost:27017/carbot_auth';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database...');

    // Delete all Tenants to start fresh and remove the old typos
    const result = await Tenant.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} old showrooms. All clean!`);
    
    process.exit(0);
}

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
