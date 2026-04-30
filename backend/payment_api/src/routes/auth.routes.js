/**
 * auth.routes.js — Client registration & login.
 *
 * POST /api/auth/register  → creates client + wallet, returns JWT
 * POST /api/auth/login     → verifies credentials, returns JWT
 */

const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");
const db      = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const signToken  = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

/* Validation rules */
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Min 6 characters"),
  body("role").isIn(["buyer", "seller"]).withMessage("Role must be buyer or seller"),
];

/* POST /api/auth/register */
router.post("/register", registerRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, email, password, role } = req.body;

  if ([...db.users.values()].find((u) => u.email === email))
    return res.status(409).json({ error: "Email already registered" });

  const clientId     = `CL-${uuidv4().slice(0, 8).toUpperCase()}`;  // e.g. CL-A3F9B21C
  const passwordHash = await bcrypt.hash(password, 10);

  /* Create user */
  const user = { clientId, name, email, passwordHash, role, createdAt: new Date().toISOString() };
  db.users.set(clientId, user);

  /* Create wallet linked to user */
  db.wallets.set(clientId, { clientId, balance: 0, currency: "NPR", updatedAt: user.createdAt });

  const token = signToken({ clientId, email, role });
  res.status(201).json({ message: "Account created", clientId, role, token });
});

/* POST /api/auth/login */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = [...db.users.values()].find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ clientId: user.clientId, email, role: user.role });
  res.json({ message: "Login successful", clientId: user.clientId, role: user.role, token });
});

module.exports = router;
