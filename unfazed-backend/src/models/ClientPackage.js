const mongoose = require('mongoose');

const clientPackageSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    packageName: {
      type: String,
      required: true,
    },
    totalSessions: {
      type: Number,
      required: true,
    },
    usedSessions: {
      type: Number,
      default: 0,
    },
    remainingSessions: {
      type: Number,
      required: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'exhausted', 'expired'],
      default: 'active',
      index: true,
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientPackage', clientPackageSchema);
