const router = require('express').Router();

const authRoutes = require('./auth.routes');
const notificationRoutes = require('./notification.routes');
const preferenceRoutes = require('./preference.routes');
const templateRoutes = require('./template.routes');

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Notification API is healthy',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/templates', templateRoutes);

module.exports = router;
