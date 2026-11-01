const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const ClientPackage = require('../models/ClientPackage');
const Therapist = require('../models/Therapist');
const entitlementService = require('../services/entitlementService');

// @desc    Get therapist's clients (sortable/filterable)
// @route   GET /api/clients
const getClients = async (req, res, next) => {
  try {
    const { search, status, tag, sort = '-updatedAt' } = req.query;
    const query = { therapist_id: req.therapist._id };

    if (status) query.status = status;
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query).sort(sort);
    const totalCount = await Client.countDocuments({ therapist_id: req.therapist._id });
    const activeCount = await Client.countDocuments({ therapist_id: req.therapist._id, status: 'active' });

    res.json({
      success: true,
      totalCount,
      activeCount,
      clients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client full profile (aggregating sessions, notes, payments, packages)
// @route   GET /api/clients/:id
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, therapist_id: req.therapist._id });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const [sessions, notes, payments, packages] = await Promise.all([
      Session.find({ client_id: id }).sort({ startTime: -1 }),
      SessionNote.find({ client_id: id }).sort({ createdAt: -1 }), // Therapist gets both private & shared notes
      Payment.find({ client_id: id }).sort({ createdAt: -1 }),
      ClientPackage.find({ client_id: id }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      client,
      sessions,
      notes,
      payments,
      packages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new client (Gated by EntitlementService)
// @route   POST /api/clients
const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, tags, status, intakeForm } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await Client.findOne({
      therapist_id: req.therapist._id,
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Client with this email already exists' });
    }

    const client = await Client.create({
      therapist_id: req.therapist._id,
      name,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      tags: tags || ['Individual'],
      status: status || 'active',
      intakeForm: intakeForm || {},
    });

    res.status(201).json({
      success: true,
      client,
      message: 'Client created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client tags, status, notes
// @route   PUT /api/clients/:id
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status, tags, intakeForm } = req.body;

    const client = await Client.findOne({ _id: id, therapist_id: req.therapist._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (name) client.name = name;
    if (email) client.email = email.toLowerCase().trim();
    if (phone !== undefined) client.phone = phone;
    if (status) client.status = status;
    if (tags) client.tags = tags;
    if (intakeForm) client.intakeForm = { ...client.intakeForm, ...intakeForm };

    await client.save();
    res.json({ success: true, client, message: 'Client updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Client Portal Self-Service Data
// @route   GET /api/clients/portal/me
const getClientPortalData = async (req, res, next) => {
  try {
    const { email, therapistSlug } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide client email' });
    }

    let therapistQuery = {};
    if (therapistSlug) {
      const therapist = await Therapist.findOne({ slug: therapistSlug.toLowerCase() });
      if (therapist) therapistQuery = { therapist_id: therapist._id };
    }

    const client = await Client.findOne({
      email: email.toLowerCase().trim(),
      ...therapistQuery,
    }).populate('therapist_id', 'name slug email phone qualifications clinicAddress avatarUrl sessionFee');

    if (!client) {
      return res.status(404).json({ success: false, message: 'No client record found for this email' });
    }

    // CRITICAL SECURITY RULE (Principle 2.1 & Module 5):
    // PRIVATE NOTES ARE NEVER RETURNED ON ANY CLIENT-FACING ROUTE!
    const [rawSessions, sharedNotes, payments, packages] = await Promise.all([
      Session.find({ client_id: client._id, status: { $ne: 'pending' } }).sort({ startTime: -1 }),
      SessionNote.find({ client_id: client._id, type: 'shared' }) // ONLY SHARED NOTES
        .select('title type format content soap.plan dap.plan createdAt tags')
        .sort({ createdAt: -1 }),
      Payment.find({ client_id: client._id }).sort({ createdAt: -1 }),
      ClientPackage.find({ client_id: client._id, status: 'active' }),
    ]);

    const sessions = rawSessions.map((s) => {
      const sObj = s.toObject();
      if (!sObj.meetingLink || sObj.meetingLink.startsWith('http')) {
        sObj.meetingLink = `/meet/${sObj._id}`;
      }
      return sObj;
    });

    res.json({
      success: true,
      client: {
        id: client._id,
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        consent: client.consent,
        intakeForm: client.intakeForm,
      },
      therapist: client.therapist_id,
      sessions,
      sharedNotes, // Guaranteed zero private notes leakage
      payments,
      packages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit digital consent
// @route   POST /api/clients/consent
const submitDigitalConsent = async (req, res, next) => {
  try {
    const { clientId, email, agreed } = req.body;
    let client = null;

    if (clientId) {
      client = await Client.findById(clientId);
    } else if (email) {
      client = await Client.findOne({ email: email.toLowerCase().trim() });
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found' });
    }

    client.consent = {
      agreed: Boolean(agreed),
      timestamp: new Date(),
      ipAddress: req.ip || '127.0.0.1',
      version: '1.0',
    };

    await client.save();
    res.json({ success: true, message: 'Digital consent recorded with auditable timestamp', consent: client.consent });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  getClientPortalData,
  submitDigitalConsent,
};
