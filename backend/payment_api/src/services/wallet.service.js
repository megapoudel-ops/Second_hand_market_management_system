const { v4: uuidv4 }   = require("uuid");
const Wallet           = require("../models/wallet.model");
const Transaction      = require("../models/transaction.model");
const { calcTransferFee, calcPurchaseFee } = require("../config/fees");

const TX_TYPE = { DEPOSIT: "DEPOSIT", WITHDRAW: "WITHDRAW", PURCHASE: "PURCHASE" };

/* Save a transaction record to MongoDB */
const recordTx = async (fields) => {
  const tx = new Transaction({
    id: `TX-${uuidv4().slice(0, 10).toUpperCase()}`,
    ...fields,
  });
  await tx.save();
  return tx;
};

/* Deposit: credit wallet after gateway confirmation */
const deposit = async (clientId, grossAmount, gateway, gatewayTxId) => {
  const { net, serviceCharge } = calcTransferFee(grossAmount);

  const wallet = await Wallet.findOneAndUpdate(
    { clientId },
    { $inc: { balance: net } },
    { new: true }
  );
  if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });

  return recordTx({
    type: TX_TYPE.DEPOSIT, status: "COMPLETED",
    clientId, gross: grossAmount, net, serviceCharge, commission: 0,
    gateway, gatewayTxId, balanceAfter: wallet.balance,
  });
};

/* Withdraw: debit wallet and send to gateway */
const withdraw = async (clientId, grossAmount, gateway, gatewayTxId) => {
  const { net, serviceCharge } = calcTransferFee(grossAmount);

  const wallet = await Wallet.findOne({ clientId });
  if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.balance < grossAmount)
    throw Object.assign(new Error("Insufficient balance"), { status: 400 });

  wallet.balance = parseFloat((wallet.balance - grossAmount).toFixed(2));
  await wallet.save();

  return recordTx({
    type: TX_TYPE.WITHDRAW, status: "PENDING",
    clientId, gross: grossAmount, net, serviceCharge, commission: 0,
    gateway, gatewayTxId, balanceAfter: wallet.balance,
  });
};

/* Purchase: buyer → platform fees → seller */
const purchase = async (buyerClientId, sellerClientId, purchaseAmount, orderId) => {
  const { sellerReceives, commission, serviceCharge } = calcPurchaseFee(purchaseAmount);

  // Use a MongoDB session for atomicity
  const session = await require("mongoose").startSession();
  session.startTransaction();

  try {
    const buyerWallet = await Wallet.findOne({ clientId: buyerClientId }).session(session);
    if (!buyerWallet || buyerWallet.balance < purchaseAmount)
      throw Object.assign(new Error("Insufficient buyer balance"), { status: 400 });

    // Debit buyer
    buyerWallet.balance = parseFloat((buyerWallet.balance - purchaseAmount).toFixed(2));
    await buyerWallet.save({ session });

    // Credit seller
    const sellerWallet = await Wallet.findOneAndUpdate(
      { clientId: sellerClientId },
      { $inc: { balance: sellerReceives } },
      { new: true, session }
    );
    if (!sellerWallet) throw Object.assign(new Error("Seller not found"), { status: 404 });

    await session.commitTransaction();

    const shared = { orderId, gross: purchaseAmount, commission, serviceCharge };
    const buyerTx  = await recordTx({ type: "PURCHASE", status: "COMPLETED", clientId: buyerClientId,  counterparty: sellerClientId, direction: "DEBIT",  net: purchaseAmount,  balanceAfter: buyerWallet.balance,  ...shared });
    const sellerTx = await recordTx({ type: "PURCHASE", status: "COMPLETED", clientId: sellerClientId, counterparty: buyerClientId,  direction: "CREDIT", net: sellerReceives,  balanceAfter: sellerWallet.balance, ...shared });

    return { buyerTx, sellerTx, fees: { commission, serviceCharge, total: commission + serviceCharge } };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/* Paginated transaction history */
const getHistory = async (clientId, { page = 1, limit = 20, type } = {}) => {
  const filter = { clientId, ...(type && { type }) };
  const [data, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) };
};

module.exports = { deposit, withdraw, purchase, getHistory, TX_TYPE };