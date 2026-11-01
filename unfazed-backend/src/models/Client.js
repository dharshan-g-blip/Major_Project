const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'prospective', 'completed'],
      default: 'active',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    intakeForm: {
      dob: { type: String, default: '' },
      gender: { type: String, default: '' },
      occupation: { type: String, default: '' },
      emergencyContact: { type: String, default: '' },
      emergencyPhone: { type: String, default: '' },
      presentingConcern: { type: String, default: '' },
      therapyHistory: { type: String, default: '' },
      medicalHistory: { type: String, default: '' },
      goals: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    consent: {
      agreed: { type: Boolean, default: false },
      timestamp: { type: Date, default: null },
      ipAddress: { type: String, default: '' },
      version: { type: String, default: '1.0' },
    },
    lastSessionDate: {
      type: Date,
      default: null,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
