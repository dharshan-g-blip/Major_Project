const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'branded_link', // 'branded_link', 'waitlist', 'inquiry'
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'archived'],
      default: 'new',
    },
    message: {
      type: String,
      default: '',
    },
    preferredTimes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
