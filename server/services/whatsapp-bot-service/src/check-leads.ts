import mongoose from 'mongoose';
import { Lead } from './models/Lead';

async function checkLeads() {
    const MONGO_URI = 'mongodb://localhost:27017/carbot_auth';
    await mongoose.connect(MONGO_URI);
    
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    
    console.log("\n📋 LEADS IN DATABASE:");
    leads.forEach(l => {
        console.log(`- ${l.name} (${l.phone}) wants ${l.vehicleId} on ${l.preferredDateTime}`);
    });
    
    process.exit(0);
}

checkLeads().catch(console.error);
