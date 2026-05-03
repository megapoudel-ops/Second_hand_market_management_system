require("dotenv").config({ quiet: true });
const express = require("express");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);

    if (error.code === "ECONNREFUSED" && error.hostname?.includes("mongodb.net")) {
      console.error(
        "MongoDB Atlas DNS lookup was refused. Check your internet/DNS settings, firewall/VPN, and Atlas connection string."
      );
    }

    process.exit(1);
  }
};

startServer();
