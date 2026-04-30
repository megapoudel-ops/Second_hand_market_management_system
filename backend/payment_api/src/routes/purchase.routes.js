/**
 * purchase.routes.js — Marketplace purchase (buyer → platform → seller).
 *
 * POST /api/purchase   → buyer initiates payment for an order
 *
 * Flow:
 *   1. Buyer's wallet is debited the full purchase price.
 *   2. Platform retains commission + service charge.
 *   3. Seller's wallet is credited the net amount.
 *   4. Both parties get a transaction record.
 */

const router    = require("express").Router();
const { body, validationResult } = require("express-validator");
const authenticate = require("../middleware/auth");
const walletSvc    = require("../services/wallet.service");
const { FEES }     = require("../config/fees");
const db           = require("../config/db");

router.use(authenticate);

/* POST /api/purchase */
router.post(
  "/",
  [
    body("sellerClientId").notEmpty().withMessage("sellerClientId is required"),
    body("amount").isFloat({ min: 1, max: FEES.MAX_TRANSACTION }),
    body("orderId").notEmpty().withMessage("orderId is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { sellerClientId, amount, orderId } = req.body;
    const buyerClientId = req.user.clientId;

    /* Guards */
    if (buyerClientId === sellerClientId)
      return res.status(400).json({ error: "Buyer and seller cannot be the same account" });

    if (!db.wallets.has(sellerClientId))
      return res.status(404).json({ error: "Seller not found" });

    try {
      const result = walletSvc.purchase(buyerClientId, sellerClientId, amount, orderId);

      res.status(201).json({
        message:     "Purchase successful",
        orderId,
        amount,
        fees:        result.fees,
        buyerTx:     result.buyerTx,
        sellerTx:    result.sellerTx,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

module.exports = router;
