const mongoose = require('mongoose');

const slotRangeSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // "09:00" (HH:mm)
    endTime: { type: String, required: true },   // "13:00" (HH:mm)
  },
  { _id: false }
);

const overrideSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    isAvailable: { type: Boolean, default: false },
    slots: [slotRangeSchema],
    note: { type: String, default: '' },
  },
  { _id: false }
);

const blockedSlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, default: 'Personal commitment' },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    weeklySchedule: [
      {
        dayOfWeek: { type: Number, required: true }, // 0 (Sun) to 6 (Sat)
        dayName: { type: String, required: true },   // "Monday", etc.
        isActive: { type: Boolean, default: true },
        slots: [slotRangeSchema],
      },
    ],
    overrides: [overrideSchema],
    blockedSlots: [blockedSlotSchema],
    bufferTimeMinutes: {
      type: Number,
      default: 15,
    },
    sessionDurations: {
      type: [Number],
      default: [30, 45, 60, 90],
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
