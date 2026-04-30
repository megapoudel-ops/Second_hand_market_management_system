/**
 * admin.routes.js — Internal admin endpoints (protect with IP whitelist in prod).
 *
 * GET /api/admin/earnings         → total platform revenue (commissions + charges)
 * GET /api/admin/transactions     → all platform transactions
 * GET /api/admin/clients          → list all registered clients & balances
 */

const router    = require("express").Router();
const authenticate = require("../middleware/auth");
const db           = require("../config/db");

/* Basic role guard — extend with a full RBAC system in production */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin access only" });
  next();
};

router.use(authenticate, adminOnly);

/* GET /api/admin/earnings */
router.get("/earnings", (_req, res) => {
  const txList = [...db.transactions.values()];

  const earnings = txList.reduce(
    (acc, tx) => {
      acc.totalCommission    += tx.commission    || 0;
      acc.totalServiceCharge += tx.serviceCharge || 0;
      return acc;
    },
    { totalCommission: 0, totalServiceCharge: 0 }
  );

  earnings.grandTotal = parseFloat(
    (earnings.totalCommission + earnings.totalServiceCharge).toFixed(2)
  );
  earnings.txCount = txList.length;

  res.json(earnings);
});

/* GET /api/admin/transactions */
router.get("/transactions", (req, res) => {
  const { type, page = 1, limit = 50 } = req.query;
  const all = [...db.transactions.values()]
    .filter((tx) => !type || tx.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const start = (page - 1) * limit;
  res.json({ data: all.slice(start, start + parseInt(limit)), total: all.length });
});

/* GET /api/admin/clients */
router.get("/clients", (_req, res) => {
  const clients = [...db.users.values()].map((user) => {
    const wallet = db.wallets.get(user.clientId);
    return {
      clientId: user.clientId,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      balance:  wallet?.balance ?? 0,
      currency: "NPR",
    };
  });
  res.json({ total: clients.length, clients });
});

module.exports = router;
