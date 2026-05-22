const Notification = require('../models/notification.model');
const Preference = require('../models/preference.model');
const Template = require('../models/template.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { sendEmail } = require('./email.service');
const { sendSms } = require('./sms.service');
const { sendPush } = require('./push.service');
const { renderTemplate } = require('./template.service');

function mapToObject(value) {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (typeof value.toObject === 'function') {
    return value.toObject();
  }

  return value;
}

async function buildPayload(payload) {
  if (!payload.templateKey) {
    return payload;
  }

  const template = await Template.findOne({ key: payload.templateKey, isActive: true });

  if (!template) {
    throw new ApiError(404, 'Notification template not found');
  }

  const rendered = renderTemplate(template, payload.variables);
  const defaultChannels = Array.isArray(template.defaultChannels) ? template.defaultChannels : [];

  return {
    ...payload,
    title: payload.title || rendered.title,
    message: payload.message || rendered.message,
    type: payload.type || template.type,
    channels:
      payload.channels && payload.channels.length
        ? payload.channels
        : defaultChannels.length
          ? defaultChannels
          : ['in_app']
  };
}

async function getAllowedChannels(userId, type, requestedChannels) {
  const preference = await Preference.findOne({ user: userId });

  if (!preference) {
    return requestedChannels;
  }

  if (preference.mutedTypes.includes(type)) {
    return [];
  }

  return requestedChannels.filter((channel) => preference.channels[channel]);
}

async function dispatchNotification(notification) {
  const recipient = await User.findById(notification.recipient);

  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found');
  }

  const channels = await getAllowedChannels(
    recipient._id,
    notification.type,
    notification.channels.length ? notification.channels : ['in_app']
  );

  if (!channels.length) {
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();
    return notification;
  }

  try {
    if (channels.includes('email') && recipient.email) {
      await sendEmail({
        to: recipient.email,
        subject: notification.title,
        text: notification.message
      });
    }

    if (channels.includes('sms') && recipient.phone) {
      await sendSms({
        to: recipient.phone,
        message: notification.message
      });
    }

    if (channels.includes('push') && Array.isArray(recipient.pushTokens) && recipient.pushTokens.length) {
      await sendPush({
        tokens: recipient.pushTokens,
        title: notification.title,
        message: notification.message,
        data: mapToObject(notification.metadata)
      });
    }

    notification.channels = channels;
    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.failureReason = undefined;
  } catch (error) {
    notification.status = 'failed';
    notification.failureReason = error.message;
  }

  await notification.save();
  return notification;
}

async function createAndDispatch(payload) {
  const preparedPayload = await buildPayload(payload);
  const recipient = await User.findById(preparedPayload.recipient);

  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found');
  }

  const notification = await Notification.create(preparedPayload);

  if (notification.scheduledFor && notification.scheduledFor > new Date()) {
    return notification;
  }

  return dispatchNotification(notification);
}

async function dispatchDueNotifications(now = new Date()) {
  const dueNotifications = await Notification.find({
    status: 'pending',
    scheduledFor: { $lte: now }
  });

  const results = [];

  for (const notification of dueNotifications) {
    results.push(await dispatchNotification(notification));
  }

  return results;
}

module.exports = {
  createAndDispatch,
  dispatchDueNotifications,
  dispatchNotification
};
