const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    if (config.mongoDnsServers.length > 0) {
      dns.setServers(config.mongoDnsServers);
    }

    const connection = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: config.mongoServerSelectionTimeoutMs
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      throw new Error(
        `Unable to connect to MongoDB at ${config.mongoUri}. ` +
          'Check Atlas network access, database credentials, and DNS. ' +
          `Current DNS servers: ${config.mongoDnsServers.join(', ') || 'system default'}.`
      );
    }

    throw error;
  }
}

module.exports = connectDB;
