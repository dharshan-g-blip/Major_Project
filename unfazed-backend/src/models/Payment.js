const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    order_id: {
      type: String, // Razorpay order_id
      required: true,
    },
    gateway_transaction_id: {
      type: String, // Razorpay payment_id (pay_xxx)
      default: null,
    },
    amount: {
      type: Number, // Gross amount in INR
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    platform_fee: {
      type: Number, // Commission / convenience fee
      default: 0,
    },
    gst_amount: {
      type: Number, // 18% GST where applicable
      default: 0,
    },
    net_amount: {
      type: Number, // Net received by therapist
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    invoice_number: {
      type: String,
      default: '',
    },
    invoice_url: {
      type: String,
      default: '',
    },
    payment_method: {
      type: String,
      default: 'UPI',
    },
    description: {
      type: String,
      default: 'Psychotherapy Session Fee',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
