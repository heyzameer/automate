import mongoose from 'mongoose';

async function reactivate() {
    await mongoose.connect('mongodb://localhost:27017/carbot_auth');
    
    // We update every tenant to be Active and have an expiry in 2027
    const result = await mongoose.connection.db.collection('tenants').updateMany(
        {}, 
        { 
            $set: { 
                isActive: true, 
                expiryDate: new Date('2027-04-01T00:00:00Z') 
            } 
        }
    );
    
    console.log(`✅ SUCCESS! Reactivated ${result.modifiedCount} showrooms.`);
    process.exit(0);
}

reactivate().catch(console.error);
