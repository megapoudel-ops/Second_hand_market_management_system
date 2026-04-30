/**
 * gateway.service.js — Payment gateway integrations.
 *
 * Each gateway exposes two methods:
 *   initiateDeposit(amount, clientId, meta) → { gatewayTxId, redirectUrl? }
 *   initiateWithdraw(amount, accountInfo)   → { gatewayTxId, status }
 *
 * In production replace the mock bodies with real SDK/API calls.
 * eSewa  → https://developer.esewa.com.np
 * Khalti → https://docs.khalti.com
 * Bank   → Use your bank's Payout API
 */

const { v4: uuidv4 } = require("uuid");

/* ── Helpers ─────────────────────────────────────────────────── */

/** Simulate a gateway call (200ms latency in dev). */
const mockGateway = async (payload) => {
  await new Promise((r) => setTimeout(r, 200));
  return { gatewayTxId: `GTW-${uuidv4().slice(0, 8).toUpperCase()}`, ...payload };
};

/* ── eSewa ───────────────────────────────────────────────────── */

const esewa = {
  /**
   * Initiate a deposit via eSewa.
   * In prod: call eSewa payment initiation endpoint and return redirect URL.
   */
  async initiateDeposit(amount, clientId) {
    return mockGateway({
      gateway: "esewa",
      status: "PENDING",
      redirectUrl: `https://esewa.com.np/pay?merchantId=${process.env.ESEWA_MERCHANT_ID}&amt=${amount}&oid=${clientId}`,
    });
  },

  /**
   * Verify eSewa payment callback token.
   * In prod: POST token to eSewa verify endpoint and check response.
   */
  async verifyPayment(token) {
    return mockGateway({ gateway: "esewa", verified: true, token });
  },

  /** Initiate payout to eSewa wallet. */
  async initiateWithdraw(amount, esewaId) {
    return mockGateway({ gateway: "esewa", status: "PROCESSING", esewaId, amount });
  },
};

/* ── Khalti ─────────────────────────────────────────────────── */

const khalti = {
  async initiateDeposit(amount, clientId) {
    return mockGateway({
      gateway: "khalti",
      status: "PENDING",
      redirectUrl: `https://khalti.com/pay?key=${process.env.KHALTI_SECRET_KEY}&amount=${amount * 100}&purchase_order_id=${clientId}`,
    });
  },

  /** Verify Khalti payment using pidx/token. */
  async verifyPayment(pidx) {
    return mockGateway({ gateway: "khalti", verified: true, pidx });
  },

  async initiateWithdraw(amount, khaltiId) {
    return mockGateway({ gateway: "khalti", status: "PROCESSING", khaltiId, amount });
  },
};

/* ── Bank Transfer ───────────────────────────────────────────── */

const bank = {
  async initiateDeposit(amount, clientId) {
    return mockGateway({
      gateway: "bank",
      status: "PENDING",
      instructions: `Transfer NPR ${amount} to Account: 0100123456789 (XYZ Bank) with ref: ${clientId}`,
    });
  },

  async initiateWithdraw(amount, { accountNumber, bankName, accountName }) {
    return mockGateway({
      gateway: "bank",
      status: "PROCESSING",
      accountNumber,
      bankName,
      accountName,
      amount,
    });
  },
};

/* ── Gateway router ─────────────────────────────────────────── */

const GATEWAYS = { esewa, khalti, bank };

/**
 * Resolve the correct gateway by name.
 * @param {"esewa"|"khalti"|"bank"} name
 */
const getGateway = (name) => {
  const gw = GATEWAYS[name?.toLowerCase()];
  if (!gw) throw new Error(`Unsupported gateway: ${name}`);
  return gw;
};

module.exports = { getGateway, GATEWAYS };
