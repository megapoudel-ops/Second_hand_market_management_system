const mongoose = require('mongoose');
const config = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: config.mongoServerSelectionTimeoutMs
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      throw new Error(
        `Unable to connect to MongoDB at ${config.mongoUri}. ` +
          'Start a MongoDB server locally or set MONGO_URI in .env to a reachable MongoDB connection string.'
      );
    }

    throw error;
  }
}

module.exports = connectDB;
