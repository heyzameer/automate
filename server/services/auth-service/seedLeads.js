const mongoose = require('mongoose');

async function run() {
  const uri = "mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/?retryWrites=true&w=majority";
  
  try {
    const invConn = await mongoose.createConnection('mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/carbot_inventory?retryWrites=true&w=majority').asPromise();
    const botConn = await mongoose.createConnection('mongodb+srv://user:zGrxrSAsruBZ3zxt@cluster0.iriaonw.mongodb.net/carbot_bot?retryWrites=true&w=majority').asPromise();
    
    // We already have the Tenant ID from previous run
    const tenantIdStr = "69f89cd8dfb776187a94bb08";
    
    const Vehicle = invConn.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));
    const vehicle = await Vehicle.findOne({ tenantId: tenantIdStr });
    const vehicleId = vehicle ? vehicle._id.toString() : '';

    const Lead = botConn.model('Lead', new mongoose.Schema({}, { strict: false, collection: 'leads' }));
    const Campaign = botConn.model('Campaign', new mongoose.Schema({}, { strict: false, collection: 'campaigns' }));

    // 1. DUMMY LEADS
    const dummyLeads = [
      {
        tenantId: tenantIdStr,
        name: "Rahul Sharma",
        phone: "+919876543210",
        source: "WhatsApp Campaign",
        stage: "Test Drive",
        status: "booked",
        score: 85,
        priority: "Hot",
        vehicleId: vehicleId,
        interestedVehicles: vehicleId ? [vehicleId] : [],
        preferredDateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        callLogs: [
          { date: new Date(), note: "Customer very interested in the SUV. Booked a test drive for tomorrow.", agent: "Bot" }
        ],
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: tenantIdStr,
        name: "Priya Patel",
        phone: "+919876543211",
        source: "Website Lead",
        stage: "Negotiation",
        status: "negotiation",
        score: 92,
        priority: "Hot",
        vehicleId: vehicleId,
        interestedVehicles: vehicleId ? [vehicleId] : [],
        callLogs: [
          { date: new Date(Date.now() - 86400000), note: "Test drive completed successfully. Currently discussing final pricing.", agent: "Sales Staff" }
        ],
        lastActivity: new Date(),
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date()
      },
      {
        tenantId: tenantIdStr,
        name: "Amit Kumar",
        phone: "+919876543212",
        source: "Direct Query",
        stage: "New",
        status: "new",
        score: 30,
        priority: "Warm",
        interestedVehicles: [],
        callLogs: [],
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('Inserting Leads...');
    for (let lead of dummyLeads) {
      await Lead.updateOne(
        { phone: lead.phone, tenantId: tenantIdStr },
        { $set: lead },
        { upsert: true }
      );
    }
    console.log('Leads seeded successfully.');

    // 2. DUMMY CAMPAIGNS
    const dummyCampaigns = [
      {
        tenantId: tenantIdStr,
        name: "Weekend SUV Offers",
        type: "whatsapp",
        audience: "warm",
        message: "Hey {{name}}, check out our exclusive weekend offers on premium SUVs! Book a test drive today to avail flat ₹50,000 discount.",
        status: "completed",
        stats: {
          total: 150,
          sent: 148,
          delivered: 145,
          read: 120,
          failed: 2
        },
        scheduledAt: new Date(Date.now() - 864000000), // 10 days ago
        createdAt: new Date(Date.now() - 864000000),
        updatedAt: new Date(Date.now() - 864000000)
      },
      {
        tenantId: tenantIdStr,
        name: "Diwali Special Discount",
        type: "whatsapp",
        audience: "all",
        message: "Wishing you a Happy Diwali! ✨ Drive home your dream car this festive season with exclusive 0% EMI options. Tap below to explore the showroom.",
        status: "scheduled",
        stats: {
          total: 0, sent: 0, delivered: 0, read: 0, failed: 0
        },
        scheduledAt: new Date(Date.now() + 864000000), // 10 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('Inserting Campaigns...');
    for (let camp of dummyCampaigns) {
      await Campaign.updateOne(
        { name: camp.name, tenantId: tenantIdStr },
        { $set: camp },
        { upsert: true }
      );
    }
    console.log('Campaigns seeded successfully.');

  } finally {
    console.log('Done');
    process.exit(0);
  }
}
run().catch(console.error);
