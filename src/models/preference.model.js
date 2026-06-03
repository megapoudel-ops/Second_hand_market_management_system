const mongoose = require('mongoose');

const channelPreferenceSchema = new mongoose.Schema(
  {
    in_app: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    channels: {
      type: channelPreferenceSchema,
      default: () => ({})
    },
    mutedTypes: [
      {
        type: String,
        enum: ['system', 'listing', 'order', 'payment', 'message', 'review', 'promotion']
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Preference', preferenceSchema);
