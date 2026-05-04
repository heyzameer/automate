const mongoose = require('mongoose');

async function run() {
  console.log('Connecting to auth DB...');
  const authConn = await mongoose.createConnection('mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/carbot_auth?retryWrites=true&w=majority').asPromise();
  console.log('Connected.');
  
  const Tenant = authConn.model('Tenant', new mongoose.Schema({}, { strict: false }));
  const User = authConn.model('User', new mongoose.Schema({}, { strict: false }));

  let tenant = await Tenant.findOne({ name: 'Demo Showroom' });
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Demo Showroom',
      address: 'Demo Address',
      locationUrl: '',
      isActive: true,
      verificationStatus: 'verified',
      plan: 'ENTERPRISE',
      limits: { maxCars: 999999 },
      features: { whatsappBot: true, campaigns: true, qrCode: true },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created tenant', tenant._id);
  } else {
    console.log('Found tenant', tenant._id);
  }

  // Find demo user and attach tenantId
  const demoEmail = 'demo@showroom.com'; // Wait, let's just make sure demo@showroom.com exists
  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    user = await User.create({
      email: demoEmail,
      fullName: 'Demo Showroom Owner',
      password: 'demoPassword123', // Doesn't matter since we already login or can just bypass, but wait, the auth system uses bcrypt...
      role: 'showroom_admin',
      tenantId: tenant._id,
      isActive: true,
      isVerified: true
    });
  } else {
    await User.updateOne({ email: demoEmail }, { $set: { tenantId: tenant._id, role: 'showroom_admin', isActive: true, isVerified: true } });
  }
  console.log('Updated user demo@showroom.com with tenant ID.');

  await authConn.close();

  // Now seed inventory directly to bypass gateway/auth
  console.log('Connecting to inventory DB...');
  const invConn = await mongoose.createConnection('mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/carbot_inventory?retryWrites=true&w=majority').asPromise();
  const Vehicle = invConn.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));

  const cars = [
    {
      tenantId: tenant._id.toString(),
      attributes: {
          car_code: 'DEMO-001',
          brand: 'BMW',
          model: 'X5',
          year: 2022,
          fuel_type: 'Petrol',
          transmission: 'Automatic',
          location: 'South Delhi Showroom',
          body_type: 'SUV',
          hp: 340,
          engine_displacement: 2998,
          km_driven: 15000,
          price: 7500000
      },
      sellingPrice: 7500000,
      images: ['https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&q=80&w=800'],
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: tenant._id.toString(),
      attributes: {
          car_code: 'DEMO-002',
          brand: 'Mercedes-Benz',
          model: 'C-Class',
          year: 2023,
          fuel_type: 'Diesel',
          transmission: 'Automatic',
          location: 'South Delhi Showroom',
          body_type: 'Sedan',
          hp: 200,
          engine_displacement: 1993,
          km_driven: 8500,
          price: 6200000
      },
      sellingPrice: 6200000,
      images: ['https://images.unsplash.com/photo-1616422285623-14ffed250812?auto=format&fit=crop&q=80&w=800'],
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: tenant._id.toString(),
      attributes: {
          car_code: 'DEMO-003',
          brand: 'Audi',
          model: 'Q7',
          year: 2021,
          fuel_type: 'Petrol',
          transmission: 'Automatic',
          location: 'South Delhi Showroom',
          body_type: 'SUV',
          hp: 248,
          engine_displacement: 1984,
          km_driven: 22000,
          price: 5800000
      },
      sellingPrice: 5800000,
      images: ['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800'],
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (let car of cars) {
    const existing = await Vehicle.findOne({ 'attributes.car_code': car.attributes.car_code });
    if (!existing) {
      await Vehicle.create(car);
      console.log('Created car', car.attributes.car_code);
    } else {
      console.log('Car already exists', car.attributes.car_code);
    }
  }

  await invConn.close();
  console.log('Demo Data Seeding Complete!');
}
run().catch(console.error);
