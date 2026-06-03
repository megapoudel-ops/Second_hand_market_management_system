const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not configured');
    }

    if (process.env.MONGO_DNS_SERVERS) {
      const dnsServers = process.env.MONGO_DNS_SERVERS
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

      if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
      }
    }

    const timeoutMs = Number(process.env.MONGO_TIMEOUT_MS) || 10000;
    const connection = mongoose.connect(mongoUri, {
      connectTimeoutMS: timeoutMs,
      serverSelectionTimeoutMS: timeoutMs,
    });

    await Promise.race([
      connection,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`MongoDB connection timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);

    console.log('MongoDB connected');
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
