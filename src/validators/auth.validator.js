const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(30).allow('', null),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('admin', 'seller', 'buyer').default('buyer')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
