const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const channels = Joi.array().items(Joi.string().valid('in_app', 'email', 'sms', 'push')).min(1).default(['in_app']);

const notificationSchema = Joi.object({
  recipient: objectId.required(),
  title: Joi.string().max(140).required(),
  message: Joi.string().max(2000).required(),
  type: Joi.string()
    .valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion')
    .default('system'),
  channels,
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  scheduledFor: Joi.date().iso().greater('now'),
  metadata: Joi.object().default({})
});

const bulkNotificationSchema = Joi.object({
  recipients: Joi.array().items(objectId).min(1).required(),
  title: Joi.string().max(140).required(),
  message: Joi.string().max(2000).required(),
  type: Joi.string()
    .valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion')
    .default('system'),
  channels,
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  scheduledFor: Joi.date().iso().greater('now'),
  metadata: Joi.object().default({})
});

const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isRead: Joi.boolean(),
  type: Joi.string().valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion'),
  status: Joi.string().valid('pending', 'sent', 'failed')
});

module.exports = {
  notificationSchema,
  bulkNotificationSchema,
  notificationQuerySchema
};
