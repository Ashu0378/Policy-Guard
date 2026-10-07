const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/policyguard_scanner';
  try {
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MongoDB (${error.message}).`);
    console.warn(`[Database Warning] Application running with in-memory storage fallback mode.`);
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
