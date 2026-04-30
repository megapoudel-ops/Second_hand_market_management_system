const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  type:         { type: String, enum: ["DEPOSIT", "WITHDRAW", "PURCHASE", "REFUND"] },
  status:       { type: String, enum: ["PENDING", "COMPLETED", "FAILED"] },
  clientId:     { type: String, required: true },
  counterparty: String,
  direction:    String,
  gross:        Number,
  net:          Number,
  serviceCharge:Number,
  commission:   Number,
  gateway:      String,
  gatewayTxId:  String,
  orderId:      String,
  balanceAfter: Number,
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);