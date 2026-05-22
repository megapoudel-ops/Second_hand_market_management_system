const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token is required');
  }

  const token = header.slice(7);
  let payload;

  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Authentication token has expired');
    }

    throw new ApiError(401, 'Invalid authentication token');
  }

  const user = await User.findById(payload.sub).select('-password');

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid or inactive user');
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication is required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

module.exports = { authenticate, authorize };
