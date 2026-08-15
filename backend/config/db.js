const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolution for Windows Atlas SRV compatibility
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignored
}

let isInMemoryMode = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/francisalian_youth_db';
  
  const mongooseOptions = {
    serverSelectionTimeoutMS: 2000,
    connectTimeoutMS: 2000,
    maxPoolSize: 20,
    minPoolSize: 2,
    socketTimeoutMS: 20000,
  };

  try {
    const conn = await mongoose.connect(uri, mongooseOptions);
    console.log(`[Database] MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    isInMemoryMode = false;
    return true;
  } catch (error) {
    console.warn(`[Database Warning] Atlas connect attempt (${error.message}). Operating with active in-memory store for instant zero-latency responses.`);
    isInMemoryMode = true;
    return false;
  }
};

const getIsInMemory = () => isInMemoryMode;

module.exports = { connectDB, getIsInMemory };
