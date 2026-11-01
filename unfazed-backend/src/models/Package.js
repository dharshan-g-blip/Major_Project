const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
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
    sessionCount: {
      type: Number,
      required: true,
      enum: [3, 6, 12, 10, 20],
      default: 3,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    perSessionRate: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 10,
    },
    validityDays: {
      type: Number,
      default: 90,
    },
    description: {
      type: String,
      default: 'Comprehensive multi-session therapy package with priority scheduling.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
