const User = require('../models/user.model');
const Preference = require('../models/preference.model');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { signToken } = require('../utils/token');

const register = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  const user = await User.create(req.body);
  await Preference.create({ user: user._id });

  const token = signToken(user);

  success(res, 201, 'User registered successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);

  success(res, 200, 'Login successful', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = { register, login };
