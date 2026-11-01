const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema(
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
      index: true,
    },
    title: {
      type: String,
      default: 'Session Clinical Note',
      trim: true,
    },
    type: {
      type: String,
      enum: ['private', 'shared'],
      required: true,
      index: true,
      // 'private': internal clinical thoughts, hypotheses (never returned to client)
      // 'shared': psychoeducation, homework, shared action plans (accessible in Client Portal)
    },
    format: {
      type: String,
      enum: ['freeform', 'soap', 'dap'],
      default: 'freeform',
    },
    content: {
      type: String, // Rich text HTML / TipTap JSON string
      default: '',
    },
    soap: {
      subjective: { type: String, default: '' },
      objective: { type: String, default: '' },
      assessment: { type: String, default: '' },
      plan: { type: String, default: '' },
    },
    dap: {
      data: { type: String, default: '' },
      assessment: { type: String, default: '' },
      plan: { type: String, default: '' },
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
