const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isValidGmailAddress = (email = "") => {
  const normalizedEmail = normalizeEmail(email);
  const [localPart, domain] = normalizedEmail.split("@");

  if (domain !== "gmail.com" || !localPart) {
    return false;
  }

  if (localPart.length < 6 || localPart.length > 30) {
    return false;
  }

  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return false;
  }

  return /^[a-z0-9.]+$/.test(localPart);
};

const getTokenExpiry = (rememberMe) => (rememberMe === true ? "30d" : "7d");

//Register API//
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (!isValidGmailAddress(normalizedEmail)) {
    return res.status(400).json({
      error: "Only valid Gmail addresses are allowed"
    });
  }

  // check if user exists
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ error: "User already exists" });
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // save user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword
  });

  // create token
  const expiresIn = getTokenExpiry(req.body.rememberMe);
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  res.status(201).json({
    message: "User registered",
    token,
    expiresIn
  });
};

//Login API//
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!isValidGmailAddress(normalizedEmail)) {
    return res.status(400).json({
      error: "Only valid Gmail addresses are allowed"
    });
  }

  // find user
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // generate token
  const expiresIn = getTokenExpiry(req.body.rememberMe);
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  res.json({
    message: "Login successful",
    token,
    expiresIn
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
