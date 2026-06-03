const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['system', 'listing', 'order', 'payment', 'message', 'review', 'promotion'],
      default: 'system'
    },
    defaultChannels: [
      {
        type: String,
        enum: ['in_app', 'email', 'sms', 'push']
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
