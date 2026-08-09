const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();

try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

const User = require('./models/User');
const Member = require('./models/Member');
const Subscription = require('./models/Subscription');
const { Income, Expense } = require('./models/Finance');
const Event = require('./models/Event');
const Attendance = require('./models/Attendance');
const Gallery = require('./models/Gallery');
const memoryStore = require('./store/memoryStore');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/francisalian_youth_db';
    console.log(`[Seed] Connecting to MongoDB Atlas: ${mongoUri}`);
    
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    } catch (err1) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    }

    console.log('[Seed] MongoDB Atlas Connected Successfully!');

    // Clear collections
    await User.deleteMany({});
    await Member.deleteMany({});
    await Subscription.deleteMany({});
    await Income.deleteMany({});
    await Expense.deleteMany({});
    await Event.deleteMany({});
    await Attendance.deleteMany({});
    await Gallery.deleteMany({});

    // Seed Users
    await User.insertMany(memoryStore.users);
    console.log('[Seed] Users seeded!');

    // Seed Members
    await Member.insertMany(memoryStore.members);
    console.log('[Seed] Members seeded!');

    // Seed Subscriptions
    await Subscription.insertMany(memoryStore.subscriptions);
    console.log('[Seed] Subscriptions seeded!');

    // Seed Income & Expense
    await Income.insertMany(memoryStore.income);
    await Expense.insertMany(memoryStore.expense);
    console.log('[Seed] Finance records seeded!');

    // Seed Events
    await Event.insertMany(memoryStore.events);
    console.log('[Seed] Events seeded!');

    // Seed Attendance
    await Attendance.insertMany(memoryStore.attendance);
    console.log('[Seed] Attendance seeded!');

    // Seed Gallery
    await Gallery.insertMany(memoryStore.albums);
    console.log('[Seed] Gallery seeded!');

    console.log('\n===================================================');
    console.log('Seed Completed Successfully to MongoDB Atlas!');
    console.log('Default Roles & Login Credentials:');
    console.log('- Admin: admin@church.org / Admin@123');
    console.log('- Pastor: pastor@church.org / Admin@123');
    console.log('- Treasurer: treasurer@church.org / Admin@123');
    console.log('- Secretary: secretary@church.org / Admin@123');
    console.log('- Youth Leader: leader@church.org / Admin@123');
    console.log('- Youth Member: member@church.org / Admin@123');
    console.log('===================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
