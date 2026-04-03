import mongoose from 'mongoose';
import { Tenant } from './models/Tenant';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
    // Connect to the Auth Database
    const MONGO_URI = 'mongodb://localhost:27017/carbot_auth';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Database...');

    const testTenant = await Tenant.findOneAndUpdate(
        { slug: 'test-showroom' },
        {
            name: 'UNIQUE CARS',
            slug: 'unique-cars',
            isActive: true,
            whatsappConfig: {
                phoneNumberId: '1052111457987266', // Copied from your portal
                accessToken: 'EAATrfQLFbBsBRJqYZCVFRBVQos9vGIxTxW6DkHMvAqy7C5IxmjcrGdCPQmZANQrBe9XG63vmNwc02n5s7A01BH6kqrxJyGdXMerBXEtKrrKH2JLs7WNPZCzhU5Pg8TwXXwTxT7Jjntid0Ojk5QR5P8OtATeB1tC7GwyxqibZBL7SxXi9uTlkrVAjKCsxHuWt2twpKq3Ez2JthBbumNzgPQwHFmBC4Nw2KqRaKEug9fnseJyvmwZAIeXZC5NyAQTKjR34JlFVMYlruJxMiGmeZAt0gZDZD', // From your portal
                botEnabled: true,
                greetingMessage: "🙏 Welcome to UNIQUE CARS! I'm your virtual assistant. How can I help you today?"
            }
        },
        { upsert: true, new: true }
    );

    console.log('✅ Test Showroom Updated:', testTenant.name);
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Error seeding:', err);
    process.exit(1);
});
