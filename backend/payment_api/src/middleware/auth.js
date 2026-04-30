/**
 * auth.js — JWT authentication middleware.
 * Attaches decoded user payload to req.user on success.
 */

const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Access token required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "secret");
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;
