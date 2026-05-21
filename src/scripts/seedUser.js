const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

const seedUser = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = 'testuser@example.com';
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: 'Test User',
        email,
        password: 'Password123',
        role: 'buyer',
        status: 'active',
      });
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('Seed user ready');
    console.log(`Email: ${email}`);
    console.log('Password: Password123');
    console.log(`Token: ${token}`);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedUser();
