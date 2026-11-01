const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ['therapist', 'client'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
