const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    bio: {
      type: String,
      default: '',
    },
    specializations: {
      type: [String],
      default: ['Anxiety', 'Depression', 'CBT'],
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    qualifications: {
      type: String,
      default: 'Licensed Clinical Psychologist (RCI Registered)',
    },
    experienceYears: {
      type: Number,
      default: 5,
    },
    sessionFee: {
      type: Number,
      default: 2000, // INR
    },
    bufferTime: {
      type: Number,
      default: 15, // in minutes
    },
    allowedDurations: {
      type: [Number],
      default: [30, 45, 60, 90],
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'starter', 'pro'],
      default: 'starter',
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    clinicAddress: {
      type: String,
      default: 'Online & Indiranagar, Bangalore, Karnataka',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Therapist', therapistSchema);
