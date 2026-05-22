const Joi = require('joi');

const templateSchema = Joi.object({
  key: Joi.string().lowercase().trim().min(2).max(80).required(),
  title: Joi.string().max(140).required(),
  message: Joi.string().max(2000).required(),
  type: Joi.string()
    .valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion')
    .default('system'),
  defaultChannels: Joi.array()
    .items(Joi.string().valid('in_app', 'email', 'sms', 'push'))
    .min(1)
    .default(['in_app']),
  isActive: Joi.boolean().default(true)
});

module.exports = { templateSchema };
