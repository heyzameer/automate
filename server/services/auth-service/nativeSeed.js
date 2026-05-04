const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    
    // 1. Auth Database
    const authDb = client.db('carbot_auth');
    const tenantsCol = authDb.collection('tenants');
    const usersCol = authDb.collection('users');

    console.log('Upserting Tenant...');
    const tRes = await tenantsCol.findOneAndUpdate(
      { name: 'Demo Showroom' },
      { 
        $set: {
          name: 'Demo Showroom',
          address: 'Demo Address',
          locationUrl: '',
          isActive: true,
          verificationStatus: 'verified',
          plan: 'ENTERPRISE',
          limits: { maxCars: 999999 },
          features: { whatsappBot: true, campaigns: true, qrCode: true },
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    const tenantId = tRes.value._id;
    console.log('Tenant ID:', tenantId);

    console.log('Updating user demo@showroom.com...');
    await usersCol.updateOne(
      { email: 'demo@showroom.com' },
      { $set: { tenantId: tenantId, role: 'showroom_admin', isActive: true, isVerified: true } }
    );

    // 2. Inventory Database
    const invDb = client.db('carbot_inventory');
    const vehiclesCol = invDb.collection('vehicles');

    const cars = [
      {
        tenantId: tenantId.toString(),
        attributes: {
            car_code: 'DEMO-001', brand: 'BMW', model: 'X5', year: 2022, fuel_type: 'Petrol', transmission: 'Automatic', location: 'South Delhi Showroom', body_type: 'SUV', hp: 340, engine_displacement: 2998, km_driven: 15000, price: 7500000
        },
        sellingPrice: 7500000,
        images: ['https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&q=80&w=800'],
        status: 'available',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        tenantId: tenantId.toString(),
        attributes: {
            car_code: 'DEMO-002', brand: 'Mercedes-Benz', model: 'C-Class', year: 2023, fuel_type: 'Diesel', transmission: 'Automatic', location: 'South Delhi Showroom', body_type: 'Sedan', hp: 200, engine_displacement: 1993, km_driven: 8500, price: 6200000
        },
        sellingPrice: 6200000,
        images: ['https://images.unsplash.com/photo-1616422285623-14ffed250812?auto=format&fit=crop&q=80&w=800'],
        status: 'available',
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        tenantId: tenantId.toString(),
        attributes: {
            car_code: 'DEMO-003', brand: 'Audi', model: 'Q7', year: 2021, fuel_type: 'Petrol', transmission: 'Automatic', location: 'South Delhi Showroom', body_type: 'SUV', hp: 248, engine_displacement: 1984, km_driven: 22000, price: 5800000
        },
        sellingPrice: 5800000,
        images: ['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800'],
        status: 'available',
        createdAt: new Date(), updatedAt: new Date()
      }
    ];

    for (let car of cars) {
      await vehiclesCol.updateOne(
        { 'attributes.car_code': car.attributes.car_code, tenantId: tenantId.toString() },
        { $set: car },
        { upsert: true }
      );
      console.log('Upserted vehicle:', car.attributes.car_code);
    }
    
    console.log('SUCCESS!');
  } finally {
    await client.close();
  }
}
run().catch(console.error);
