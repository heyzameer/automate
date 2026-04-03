import mongoose from 'mongoose';
import { Tenant } from './models/Tenant';
import { Vehicle } from './models/Vehicle';
import { DatabaseConnection } from './config/database';
import { logger } from './utils/logger';

// --- CONFIG ---
const SHOWROOM_NAME = "UNIQUE CARS";
const SLUG = "unique-cars";
const WA_PHONE_ID = "1052111457987266";
const WA_TOKEN = "EAATrfQLFbBsBRJqYZCVFRBVQos9vGIxTxW6DkHMvAqy7C5IxmjcrGdCPQmZANQrBe9XG63vmNwc02n5s7A01BH6kqrxJyGdXMerBXEtKrrKH2JLs7WNPZCzhU5Pg8TwXXwTxT7Jjntid0Ojk5QR5P8OtATeB1tC7GwyxqibZBL7SxXi9uTlkrVAjKCsxHuWt2twpKq3Ez2JthBbumNzgPQwHFmBC4Nw2KqRaKEug9fnseJyvmwZAIeXZC5NyAQTKjR34JlFVMYlruJxMiGmeZAt0gZDZD";

async function runSeed() {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    console.log("🚀 Starting Full Seed for UNIQUE CARS...");

    // 1. Create Tenant
    const tenant = await Tenant.findOneAndUpdate(
        { slug: SLUG },
        {
            name: SHOWROOM_NAME,
            slug: SLUG,
            isActive: true,
            whatsappConfig: {
                phoneNumberId: WA_PHONE_ID,
                accessToken: WA_TOKEN,
                botEnabled: true,
                greetingMessage: `🙏 Welcome to *${SHOWROOM_NAME}*! I'm your AI assistant. How can I help you today?`
            }
        },
        { upsert: true, new: true }
    );

    console.log(`✅ Tenant Created: ${tenant.name} (${tenant._id})`);

    // 2. Seed Cars in Inventory DB
    // We remove old test cars first to avoid duplicates
    await Vehicle.deleteMany({ tenantId: tenant._id });

    const demoCars = [
        {
            car_code: 'car01',
            brand: 'Maruti',
            model: 'Swift VXI',
            price: 550000,
            year: 2021,
            fuel: 'Petrol',
            image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000'
        },
        {
            car_code: 'car02',
            brand: 'Hyundai',
            model: 'Creta SX',
            price: 1250000,
            year: 2022,
            fuel: 'Diesel',
            image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1000'
        },
        {
            car_code: 'car03',
            brand: 'Tata',
            model: 'Nexon EV',
            price: 1450000,
            year: 2023,
            fuel: 'Electric',
            image: 'https://images.unsplash.com/photo-1633113110940-272cb250bf5c?q=80&w=1000'
        }
    ];

    for (const car of demoCars) {
        await Vehicle.create({
            tenantId: tenant._id,
            status: 'available',
            images: [car.image],
            attributes: new Map<string, any>([
                ['car_code', car.car_code],
                ['brand', car.brand],
                ['model', car.model],
                ['price', car.price],
                ['year_of_manufacture', car.year],
                ['fuel_type', car.fuel],
                ['transmission', 'Manual'],
                ['km', 12000],
                ['ownership', '1st Owner']
            ])
        });
    }


    console.log(`✅ ${demoCars.length} Cars Seeded into Inventory.`);
    console.log("\n----------------------------------");
    console.log("🔑 LOGIN CREDENTIALS");
    console.log(`Email: admin@uniquecars.com`);
    console.log(`Password: admin123`);
    console.log("----------------------------------\n");

    process.exit(0);
}

runSeed().catch(err => {
    console.error(err);
    process.exit(1);
});
