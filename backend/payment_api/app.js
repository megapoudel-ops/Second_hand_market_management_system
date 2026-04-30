require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const connectDB  = require("./src/config/db");

const authRoutes     = require("./src/routes/auth.routes");
const walletRoutes   = require("./src/routes/wallet.routes");
const purchaseRoutes = require("./src/routes/purchase.routes");
const adminRoutes    = require("./src/routes/admin.routes");

/* ── Connect to MongoDB ──────────────────────────────────────── */
connectDB();

/* ── Init Express ────────────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Global Middleware ───────────────────────────────────────── */
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

/* Rate limiting — 100 req / 15 min per IP */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
  })
);

/* ── Routes ──────────────────────────────────────────────────── */
app.use("/api/auth",     authRoutes);
app.use("/api/wallet",   walletRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/admin",    adminRoutes);

/* Health check */
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

/* 404 fallback */
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

/* Global error handler */
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

/* ── Start ───────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  Payment API running → http://localhost:${PORT}`);
  console.log(`    ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`    Fees: NPR ${process.env.SERVICE_CHARGE_FLAT || 10} flat + ${process.env.COMMISSION_PERCENT || 2.5}% commission\n`);
});

module.exports = app;