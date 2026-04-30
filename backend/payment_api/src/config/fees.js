/**
 * fees.js — Centralised fee rules for the marketplace platform.
 *
 * SERVICE_CHARGE : flat fee deducted on every deposit/withdrawal
 * COMMISSION     : % of transaction amount kept by platform on purchases
 *
 * Example on a NPR 1,000 purchase:
 *   commission  = 1000 * 2.5% = NPR 25
 *   seller gets = 1000 - 25   = NPR 975
 */

const FEES = {
  SERVICE_CHARGE_FLAT: parseFloat(process.env.SERVICE_CHARGE_FLAT) || 10,
  COMMISSION_PERCENT:  parseFloat(process.env.COMMISSION_PERCENT)  || 2.5,
  MIN_DEPOSIT:         parseFloat(process.env.MIN_DEPOSIT)          || 100,
  MIN_WITHDRAW:        parseFloat(process.env.MIN_WITHDRAW)         || 500,
  MAX_TRANSACTION:     parseFloat(process.env.MAX_TRANSACTION)      || 500000,
};

/**
 * Calculate fees for a deposit/withdrawal.
 * @param {number} amount - Gross amount in NPR
 * @returns {{ net: number, serviceCharge: number }}
 */
const calcTransferFee = (amount) => {
  const serviceCharge = FEES.SERVICE_CHARGE_FLAT;
  return { net: amount - serviceCharge, serviceCharge };
};

/**
 * Calculate fees for a buyer→seller purchase.
 * @param {number} amount - Purchase price in NPR
 * @returns {{ sellerReceives: number, commission: number, serviceCharge: number }}
 */
const calcPurchaseFee = (amount) => {
  const commission    = parseFloat(((amount * FEES.COMMISSION_PERCENT) / 100).toFixed(2));
  const serviceCharge = FEES.SERVICE_CHARGE_FLAT;
  const sellerReceives = parseFloat((amount - commission - serviceCharge).toFixed(2));
  return { sellerReceives, commission, serviceCharge };
};

module.exports = { FEES, calcTransferFee, calcPurchaseFee };
