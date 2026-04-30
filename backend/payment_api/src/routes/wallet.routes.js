/**
 * wallet.routes.js — Wallet operations (authenticated).
 *
 * GET  /api/wallet/balance            → current balance
 * POST /api/wallet/deposit/initiate   → get gateway payment URL
 * POST /api/wallet/deposit/confirm    → verify payment & credit wallet
 * POST /api/wallet/withdraw           → request payout via gateway
 * GET  /api/wallet/transactions       → paginated history
 */

const router  = require("express").Router();
const { body, query, validationResult } = require("express-validator");
const authenticate    = require("../middleware/auth");
const walletSvc       = require("../services/wallet.service");
const { getGateway }  = require("../services/gateway.service");
const { FEES }        = require("../config/fees");
const db              = require("../config/db");

/* All wallet routes require a valid JWT */
router.use(authenticate);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

/* ── GET /balance ──────────────────────────────────────────── */
router.get("/balance", (req, res) => {
  const wallet = db.wallets.get(req.user.clientId);
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json({ clientId: req.user.clientId, balance: wallet.balance, currency: "NPR" });
});

/* ── POST /deposit/initiate ────────────────────────────────── */
router.post(
  "/deposit/initiate",
  [
    body("amount").isFloat({ min: FEES.MIN_DEPOSIT, max: FEES.MAX_TRANSACTION })
      .withMessage(`Amount must be between ${FEES.MIN_DEPOSIT} and ${FEES.MAX_TRANSACTION} NPR`),
    body("gateway").isIn(["esewa", "khalti", "bank"]).withMessage("Invalid gateway"),
  ],
  validate,
  async (req, res) => {
    try {
      const { amount, gateway } = req.body;
      const gw     = getGateway(gateway);
      const result = await gw.initiateDeposit(amount, req.user.clientId);

      res.json({
        message:     "Deposit initiated — complete payment via the gateway",
        clientId:    req.user.clientId,
        gross:       amount,
        serviceCharge: FEES.SERVICE_CHARGE_FLAT,
        netCredit:   amount - FEES.SERVICE_CHARGE_FLAT,
        gateway:     result,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* ── POST /deposit/confirm ─────────────────────────────────── */
/*
 * Called after the gateway redirects back (or via webhook).
 * In production, verify the token with the gateway before crediting.
 */
router.post(
  "/deposit/confirm",
  [
    body("amount").isFloat({ min: 1 }),
    body("gateway").isIn(["esewa", "khalti", "bank"]),
    body("token").notEmpty().withMessage("Gateway token/reference required"),
  ],
  validate,
  async (req, res) => {
    try {
      const { amount, gateway, token } = req.body;
      const gw       = getGateway(gateway);
      const verified = await gw.verifyPayment(token);

      if (!verified.verified)
        return res.status(400).json({ error: "Gateway payment verification failed" });

      const tx = walletSvc.deposit(req.user.clientId, amount, gateway, verified.gatewayTxId);
      res.json({ message: "Deposit successful", transaction: tx });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* ── POST /withdraw ────────────────────────────────────────── */
router.post(
  "/withdraw",
  [
    body("amount").isFloat({ min: FEES.MIN_WITHDRAW, max: FEES.MAX_TRANSACTION })
      .withMessage(`Minimum withdrawal is ${FEES.MIN_WITHDRAW} NPR`),
    body("gateway").isIn(["esewa", "khalti", "bank"]),
    body("accountInfo").isObject().withMessage("accountInfo object required"),
    /*
     * accountInfo shape:
     *   esewa  → { esewaId: "98XXXXXXXX" }
     *   khalti → { khaltiId: "98XXXXXXXX" }
     *   bank   → { accountNumber, bankName, accountName }
     */
  ],
  validate,
  async (req, res) => {
    try {
      const { amount, gateway, accountInfo } = req.body;
      const gw     = getGateway(gateway);
      const result = await gw.initiateWithdraw(amount, accountInfo);
      const tx     = walletSvc.withdraw(req.user.clientId, amount, gateway, result.gatewayTxId);

      res.json({
        message: "Withdrawal request submitted",
        note:    "Funds arrive within 1–3 business days depending on gateway",
        transaction: tx,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/* ── GET /transactions ─────────────────────────────────────── */
router.get(
  "/transactions",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("type").optional().isIn(Object.values(walletSvc.TX_TYPE)),
  ],
  validate,
  (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const result = walletSvc.getHistory(req.user.clientId, {
      page:  parseInt(page),
      limit: parseInt(limit),
      type,
    });
    res.json(result);
  }
);

module.exports = router;
