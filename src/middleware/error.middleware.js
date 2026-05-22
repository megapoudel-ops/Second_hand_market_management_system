const ApiError = require('../utils/apiError');

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let details = error.details;

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value already exists';
    details = Object.keys(error.keyValue || {}).map((field) => ({
      field,
      message: `${field} must be unique`
    }));
  }

  const response = {
    success: false,
    message
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
