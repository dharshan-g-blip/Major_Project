const SessionNote = require('../models/SessionNote');
const Session = require('../models/Session');
const Client = require('../models/Client');
const notificationService = require('../services/notificationService');
const entitlementService = require('../services/entitlementService');

// @desc    Get notes (Therapist only - returns both private and shared)
// @route   GET /api/notes
const getNotes = async (req, res, next) => {
  try {
    const { clientId, sessionId, type } = req.query;
    const query = { therapist_id: req.therapist._id };

    if (clientId) query.client_id = clientId;
    if (sessionId) query.session_id = sessionId;
    if (type) query.type = type;

    const notes = await SessionNote.find(query)
      .populate('client_id', 'name email')
      .populate('session_id', 'startTime durationMinutes')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: notes.length, notes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
const getNoteById = async (req, res, next) => {
  try {
    const note = await SessionNote.findOne({
      _id: req.params.id,
      therapist_id: req.therapist._id,
    }).populate('client_id', 'name email');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Clinical Note (Freeform, SOAP, or DAP)
// @route   POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const { clientId, sessionId, title, type, format = 'freeform', content, soap, dap, tags } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client ID is required' });
    }

    if (!['private', 'shared'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be either 'private' or 'shared'" });
    }

    // Verify entitlement for structured templates (SOAP / DAP)
    if (format !== 'freeform') {
      const templateCheck = await entitlementService.canAccess(req.therapist._id, 'note_template', {
        template: format,
      });

      if (!templateCheck.allowed) {
        return res.status(403).json({
          success: false,
          code: 'UPGRADE_REQUIRED',
          message: templateCheck.reason,
          upgradeRequiredTier: templateCheck.upgradeRequiredTier,
        });
      }
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const note = await SessionNote.create({
      therapist_id: req.therapist._id,
      client_id: clientId,
      session_id: sessionId || null,
      title: title || (type === 'shared' ? 'Shared Session Reflections' : 'Confidential Clinical Note'),
      type,
      format,
      content: content || '',
      soap: soap || {},
      dap: dap || {},
      tags: tags || [],
    });

    // If shared note, notify client that new notes/reflections are ready
    if (type === 'shared' && client) {
      const session = sessionId ? await Session.findById(sessionId) : null;
      await notificationService.notifyPostSessionFollowup({
        session: session || { startTime: new Date() },
        therapist: req.therapist,
        client,
        sharedNoteSummary: title || 'New shared note added by your therapist.',
      });
    }

    res.status(201).json({ success: true, note, message: 'Note saved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Clinical Note
// @route   PUT /api/notes/:id
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, type, format, content, soap, dap, tags } = req.body;

    const note = await SessionNote.findOne({ _id: id, therapist_id: req.therapist._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (title) note.title = title;
    if (type) note.type = type;
    if (format) note.format = format;
    if (content !== undefined) note.content = content;
    if (soap) note.soap = { ...note.soap, ...soap };
    if (dap) note.dap = { ...note.dap, ...dap };
    if (tags) note.tags = tags;

    await note.save();
    res.json({ success: true, note, message: 'Note updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Note
// @route   DELETE /api/notes/:id
const deleteNote = async (req, res, next) => {
  try {
    const note = await SessionNote.findOneAndDelete({ _id: req.params.id, therapist_id: req.therapist._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};
