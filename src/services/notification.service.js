const Notification = require('../models/notification.model');
const Preference = require('../models/preference.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { sendEmail } = require('./email.service');
const { sendSms } = require('./sms.service');
const { sendPush } = require('./push.service');

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

    if (channels.includes('push') && recipient.pushTokens.length) {
      await sendPush({
        tokens: recipient.pushTokens,
        title: notification.title,
        message: notification.message,
        data: Object.fromEntries(notification.metadata || [])
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
  const notification = await Notification.create(payload);

  if (notification.scheduledFor && notification.scheduledFor > new Date()) {
    return notification;
  }

  return dispatchNotification(notification);
}

module.exports = {
  createAndDispatch,
  dispatchNotification
};
