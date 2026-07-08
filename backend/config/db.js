'use strict';
const mongoose = require('mongoose');

/**
 * Connects to MongoDB.
 *
 * FAIL FAST: If MONGO_URI is not set, the process exits immediately with code 1.
 * There is NO silent fallback, in-memory substitute, or default connection string.
 * Running without a real database would silently corrupt or lose production data.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error(
      '[FATAL] MONGO_URI environment variable is not set. ' +
      'Copy .env.example → .env and fill in your Atlas connection string. ' +
      'Refusing to start.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
