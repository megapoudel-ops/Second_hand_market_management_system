const bcrypt = require('bcryptjs');
const User = require('../models/User');

const PIN_REGEX = /^\d{4,6}$/;
const MIN_PASSWORD_LENGTH = 8;

const setSecurityPin = async (req, res, next) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required',
      });
    }

    if (!PIN_REGEX.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 to 6 digits',
      });
    }

    if (confirmPin !== undefined && pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PIN confirmation does not match',
      });
    }

    const user = await User.findById(req.user.id).select('+securityPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.securityPin = await bcrypt.hash(pin, 12);
    user.securityPinSetAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Security PIN set successfully',
    });
  } catch (error) {
    next(error);
  }
};

const verifySecurityPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required',
      });
    }

    if (!PIN_REGEX.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 to 6 digits',
      });
    }

    const user = await User.findById(req.user.id).select('+securityPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.securityPin) {
      return res.status(400).json({
        success: false,
        message: 'Security PIN has not been set',
      });
    }

    const isValidPin = await bcrypt.compare(pin, user.securityPin);

    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid security PIN',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Security PIN verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required',
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password confirmation does not match',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from the current password',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setSecurityPin,
  verifySecurityPin,
  changePassword,
};

