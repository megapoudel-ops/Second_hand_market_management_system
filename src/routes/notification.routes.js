const router = require('express').Router();
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  notificationSchema,
  bulkNotificationSchema,
  notificationQuerySchema
} = require('../validators/notification.validator');
const {
  createNotification,
  createBulkNotifications,
  getNotifications,
  getNotificationById,
  markRead,
  markUnread,
  markAllRead,
  deleteNotification,
  getStats,
  dispatchDue
} = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/', validate(notificationQuerySchema, 'query'), getNotifications);
router.get('/stats', getStats);
router.post('/', authorize('admin', 'seller'), validate(notificationSchema), createNotification);
router.post('/bulk', authorize('admin'), validate(bulkNotificationSchema), createBulkNotifications);
router.post('/dispatch-due', authorize('admin'), dispatchDue);
router.patch('/read-all', markAllRead);
router.get('/:id', getNotificationById);
router.patch('/:id/read', markRead);
router.patch('/:id/unread', markUnread);
router.delete('/:id', deleteNotification);

module.exports = router;
