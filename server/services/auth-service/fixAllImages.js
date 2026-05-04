const mongoose = require('mongoose');

async function run() {
  const invConn = await mongoose.createConnection('mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/carbot_inventory?retryWrites=true&w=majority').asPromise();
  const Vehicle = invConn.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));

  const newImageUrl = 'https://www.motortrend.com/uploads/2024/03/5-2025-Mercedes-Benz-AMG-G-Wagon-G63-front-view.jpg';
  
  const vehicles = await Vehicle.find({ 'attributes.car_code': 'DEMO-002' });
  let count = 0;
  for (let v of vehicles) {
    if (v.images && v.images.length > 0) {
      v.images[0] = newImageUrl;
      await Vehicle.updateOne({ _id: v._id }, { $set: { images: v.images, 'attributes.model': 'AMG G-Wagon G63', 'attributes.body_type': 'SUV' } });
      count++;
    }
  }
  
  console.log('Fixed Mercedes image globally! Modified count:', count);
  await invConn.close();
}
run().catch(console.error);
