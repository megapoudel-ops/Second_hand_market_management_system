const Preference = require('../models/preference.model');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const getMyPreferences = asyncHandler(async (req, res) => {
  const preference = await Preference.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true }
  );

  success(res, 200, 'Preferences fetched successfully', preference);
});

const updateMyPreferences = asyncHandler(async (req, res) => {
  const preference = await Preference.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  success(res, 200, 'Preferences updated successfully', preference);
});

module.exports = { getMyPreferences, updateMyPreferences };
