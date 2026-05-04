const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Register API//
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: "User already exists" });
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // save user
  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  // create token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    message: "User registered",
    token
  });
};

//Login API//
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid password" });
  }

  // generate token
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
