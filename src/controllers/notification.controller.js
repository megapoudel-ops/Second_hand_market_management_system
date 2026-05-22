const Notification = require('../models/notification.model');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { createAndDispatch } = require('../services/notification.service');

const createNotification = asyncHandler(async (req, res) => {
  const notification = await createAndDispatch({
    ...req.body,
    sender: req.user._id
  });

  success(res, 201, 'Notification created successfully', notification);
});

const createBulkNotifications = asyncHandler(async (req, res) => {
  const { recipients, ...payload } = req.body;
  const notifications = [];

  for (const recipient of recipients) {
    const notification = await createAndDispatch({
      ...payload,
      recipient,
      sender: req.user._id
    });
    notifications.push(notification);
  }

  success(res, 201, 'Bulk notifications created successfully', notifications, {
    count: notifications.length
  });
});

const getNotifications = asyncHandler(async (req, res) => {
  const page = req.query.page;
  const limit = req.query.limit;
  const skip = (page - 1) * limit;
  const filter = { recipient: req.user._id };

  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter)
  ]);

  success(res, 200, 'Notifications fetched successfully', notifications, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  success(res, 200, 'Notification fetched successfully', notification);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  success(res, 200, 'Notification marked as read', notification);
});

const markUnread = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: false, $unset: { readAt: '' } },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  success(res, 200, 'Notification marked as unread', notification);
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  success(res, 200, 'All notifications marked as read', {
    modifiedCount: result.modifiedCount
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  success(res, 200, 'Notification deleted successfully');
});

const getStats = asyncHandler(async (req, res) => {
  const [total, unread, byType] = await Promise.all([
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    Notification.aggregate([
      { $match: { recipient: req.user._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  success(res, 200, 'Notification stats fetched successfully', {
    total,
    unread,
    read: total - unread,
    byType
  });
});

module.exports = {
  createNotification,
  createBulkNotifications,
  getNotifications,
  getNotificationById,
  markRead,
  markUnread,
  markAllRead,
  deleteNotification,
  getStats
};
