const mongoose = require('mongoose');

async function run() {
  console.log('Connecting to inventory DB...');
  const invConn = await mongoose.createConnection('mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/carbot_inventory?retryWrites=true&w=majority').asPromise();
  const Vehicle = invConn.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));

  const newImageUrl = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?q=80&w=800&auto=format&fit=crop';
  
  await Vehicle.updateOne(
    { 'attributes.car_code': 'DEMO-002' },
    { $set: { images: [newImageUrl] } }
  );
  
  console.log('Fixed Mercedes image!');
  await invConn.close();
}
run().catch(console.error);
