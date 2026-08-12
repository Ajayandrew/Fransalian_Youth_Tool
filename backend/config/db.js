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
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 50,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(uri, mongooseOptions);
    console.log(`[Database] MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    isInMemoryMode = false;
    return true;
  } catch (error) {
    console.warn(`[Database Warning] Initial Atlas connect attempt: ${error.message}`);
    
    // Fallback DNS servers for Windows SRV resolution
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      const conn = await mongoose.connect(uri, mongooseOptions);
      console.log(`[Database] MongoDB Atlas Connected Successfully (via DNS Resolver): ${conn.connection.host}`);
      isInMemoryMode = false;
      return true;
    } catch (err2) {
      console.warn(`[Database Warning] Could not connect to MongoDB Atlas: ${err2.message}`);
      console.warn('[Database] Operating with active in-memory data store for maximum reliability.');
      isInMemoryMode = true;
      return false;
    }
  }
};

const getIsInMemory = () => isInMemoryMode;

module.exports = { connectDB, getIsInMemory };
