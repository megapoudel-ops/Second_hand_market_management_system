const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const validateEmail = (email) => {
  return typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

//Register API//
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ error: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    isVerified: false,
    verificationToken,
    verificationTokenExpires
  });

  res.status(201).json({
    message: "User registered. Please verify your email before logging in.",
    email: user.email,
    verificationToken
  });
};

exports.verifyEmail = async (req, res) => {
  const { email, verificationToken } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !verificationToken) {
    return res.status(400).json({ error: "Email and verification token are required." });
  }

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(400).json({ error: "User not found." });
  }

  if (user.isVerified) {
    return res.status(200).json({ message: "Email already verified." });
  }

  if (user.verificationToken !== verificationToken) {
    return res.status(400).json({ error: "Invalid verification token." });
  }

  if (!user.verificationTokenExpires || user.verificationTokenExpires < Date.now()) {
    return res.status(400).json({ error: "Verification token has expired." });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully. You may now log in." });
};

//Login API//
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(400).json({ error: "User not found." });
  }

  if (!user.isVerified) {
    return res.status(403).json({ error: "Email not verified. Please verify your email before logging in." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid password." });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token
  });
};

//Profile API//
exports.profile = async (req, res) => {
  const user = await User.findById(req.user).select("-password");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    message: "Profile fetched successfully",
    user
  });
};

//Logout API//
exports.logout = (req, res) => {
  res.json({
    message: "Logout successful"
  });
};
