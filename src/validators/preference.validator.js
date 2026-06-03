const Joi = require('joi');

const preferenceSchema = Joi.object({
  channels: Joi.object({
    in_app: Joi.boolean().default(true),
    email: Joi.boolean().default(true),
    sms: Joi.boolean().default(false),
    push: Joi.boolean().default(true)
  }).default({}),
  mutedTypes: Joi.array()
    .items(Joi.string().valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion'))
    .default([])
});

module.exports = { preferenceSchema };
