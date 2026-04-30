const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  balance:  { type: Number, default: 0 },
  currency: { type: String, default: "NPR" },
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);