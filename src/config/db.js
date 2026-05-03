const dns = require("dns");
const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in .env");
  }

  if (process.env.MONGO_DNS_SERVERS) {
    const servers = process.env.MONGO_DNS_SERVERS.split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    if (servers.length > 0) {
      dns.setServers(servers);
    }
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("DB Connected");
};

module.exports = connectDB;
