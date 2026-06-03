const express = require('express');
const {
  setSecurityPin,
  verifySecurityPin,
  changePassword,
} = require('../controllers/securityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/pin-set', protect, setSecurityPin);
router.post('/pin-verify', protect, verifySecurityPin);
router.post('/change-password', protect, changePassword);

module.exports = router;

