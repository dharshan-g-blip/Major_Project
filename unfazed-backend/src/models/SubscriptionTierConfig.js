const mongoose = require('mongoose');

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: true,
      unique: true,
      enum: ['free', 'starter', 'pro'],
    },
    displayName: {
      type: String,
      required: true,
    },
    pricePerMonthINR: {
      type: Number,
      required: true,
    },
    caps: {
      activeClients: {
        type: Number,
        default: 5, // free=5, starter=25, pro=999999
      },
      monthlySessions: {
        type: Number,
        default: 20,
      },
    },
    features: {
      noteTemplates: {
        type: [String],
        default: ['freeform'], // 'freeform', 'soap', 'dap'
      },
      analyticsDepth: {
        type: String,
        enum: ['basic_counts', 'standard_trends', 'advanced_aggregation'],
        default: 'basic_counts',
      },
      canSellPackages: {
        type: Boolean,
        default: false,
      },
      automatedWhatsApp: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionTierConfig', subscriptionTierConfigSchema);
