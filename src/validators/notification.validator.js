const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const channels = Joi.array().items(Joi.string().valid('in_app', 'email', 'sms', 'push')).min(1);

const notificationSchema = Joi.object({
  recipient: objectId.required(),
  templateKey: Joi.string().trim().lowercase().max(120),
  variables: Joi.object().default({}),
  title: Joi.when('templateKey', {
    is: Joi.exist(),
    then: Joi.string().max(140),
    otherwise: Joi.string().max(140).required()
  }),
  message: Joi.when('templateKey', {
    is: Joi.exist(),
    then: Joi.string().max(2000),
    otherwise: Joi.string().max(2000).required()
  }),
  type: Joi.string()
    .valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion')
    .default('system'),
  channels: Joi.when('templateKey', {
    is: Joi.exist(),
    then: channels,
    otherwise: channels.default(['in_app'])
  }),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  scheduledFor: Joi.date().iso().greater('now'),
  metadata: Joi.object().default({})
});

const bulkNotificationSchema = Joi.object({
  recipients: Joi.array().items(objectId).min(1).required(),
  templateKey: Joi.string().trim().lowercase().max(120),
  variables: Joi.object().default({}),
  title: Joi.when('templateKey', {
    is: Joi.exist(),
    then: Joi.string().max(140),
    otherwise: Joi.string().max(140).required()
  }),
  message: Joi.when('templateKey', {
    is: Joi.exist(),
    then: Joi.string().max(2000),
    otherwise: Joi.string().max(2000).required()
  }),
  type: Joi.string()
    .valid('system', 'listing', 'order', 'payment', 'message', 'review', 'promotion')
    .default('system'),
  channels: Joi.when('templateKey', {
    is: Joi.exist(),
    then: channels,
    otherwise: channels.default(['in_app'])
  }),
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
