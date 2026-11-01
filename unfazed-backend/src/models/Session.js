const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
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
    clientName: {
      type: String,
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },
    meetingLink: {
      type: String,
      default: 'https://meet.google.com/unfazed-demo-room',
    },
    sessionType: {
      type: String,
      default: 'Individual Therapy',
    },
    fee: {
      type: Number,
      required: true,
      default: 2000,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    client_package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientPackage',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    waitlist: [
      {
        name: String,
        email: String,
        phone: String,
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to quickly detect double booking overlaps
sessionSchema.index({ therapist_id: 1, startTime: 1, endTime: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
