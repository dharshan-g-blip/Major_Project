const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Availability = require('../models/Availability');
const { generateUniqueSlug } = require('../utils/generateSlug');
const entitlementService = require('../services/entitlementService');

const generateToken = (therapistId) => {
  return jwt.sign(
    { id: therapistId },
    process.env.JWT_SECRET || 'unfazed_jwt_secret_super_secure_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new therapist
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, specializations, languages, qualifications, sessionFee } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existing = await Therapist.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Therapist with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const slug = await generateUniqueSlug(name, Therapist);

    const therapist = await Therapist.create({
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      slug,
      specializations: specializations || ['Anxiety', 'Depression', 'CBT'],
      languages: languages || ['English', 'Hindi'],
      qualifications: qualifications || 'Licensed Clinical Psychologist (RCI)',
      sessionFee: sessionFee || 2000,
      subscriptionTier: 'starter', // Default to starter
    });

    // Create default availability template (Mon-Fri 09:00 - 17:00)
    const days = [
      { dayOfWeek: 1, dayName: 'Monday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 2, dayName: 'Tuesday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 3, dayName: 'Wednesday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 4, dayName: 'Thursday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 5, dayName: 'Friday', isActive: true, slots: [{ startTime: '10:00', endTime: '17:00' }] },
      { dayOfWeek: 6, dayName: 'Saturday', isActive: true, slots: [{ startTime: '10:00', endTime: '14:00' }] },
      { dayOfWeek: 0, dayName: 'Sunday', isActive: false, slots: [] },
    ];

    await Availability.create({
      therapist_id: therapist._id,
      weeklySchedule: days,
      bufferTimeMinutes: 15,
      sessionDurations: [30, 45, 60, 90],
      timezone: 'Asia/Kolkata',
    });

    const token = generateToken(therapist._id);
    const entitlements = await entitlementService.getTherapistEntitlements(therapist._id);

    res.status(201).json({
      success: true,
      token,
      therapist: {
        id: therapist._id,
        _id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        subscriptionTier: therapist.subscriptionTier,
        specializations: therapist.specializations,
        languages: therapist.languages,
        sessionFee: therapist.sessionFee,
        qualifications: therapist.qualifications,
      },
      entitlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate therapist & get token
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const basePrefix = cleanEmail.split('@')[0];
    const therapist = await Therapist.findOne({
      $or: [
        { email: cleanEmail },
        { email: `${basePrefix}@unfazed.in` },
        { email: `${basePrefix}@serenova.care` },
      ],
    });
    if (!therapist) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, therapist.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(therapist._id);
    const entitlements = await entitlementService.getTherapistEntitlements(therapist._id);

    res.json({
      success: true,
      token,
      therapist: {
        id: therapist._id,
        _id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        subscriptionTier: therapist.subscriptionTier,
        specializations: therapist.specializations,
        languages: therapist.languages,
        sessionFee: therapist.sessionFee,
        qualifications: therapist.qualifications,
        avatarUrl: therapist.avatarUrl,
        bio: therapist.bio,
      },
      entitlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current therapist profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const therapist = req.therapist;
    const entitlements = await entitlementService.getTherapistEntitlements(therapist._id);

    res.json({
      success: true,
      therapist,
      entitlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Client / Patient login
// @route   POST /api/auth/client/login
const clientLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide client email' });
    }

    const client = await Client.findOne({ email: email.toLowerCase().trim() }).populate(
      'therapist_id',
      'name slug qualifications clinicAddress avatarUrl'
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'No client profile found for this email. Please register as a new client or select a demo client.',
      });
    }

    const token = generateToken(client._id);
    res.json({
      success: true,
      token,
      client: {
        id: client._id,
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        therapist: client.therapist_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Client / Patient register
// @route   POST /api/auth/client/register
const clientRegister = async (req, res, next) => {
  try {
    const { name, email, phone, therapistSlug } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Please provide full name and email' });
    }

    let therapist = null;
    if (therapistSlug) {
      therapist = await Therapist.findOne({ slug: therapistSlug.toLowerCase() });
    }
    if (!therapist) {
      therapist = await Therapist.findOne(); // Default to Dr. Sharma
    }

    if (!therapist) {
      return res.status(500).json({ success: false, message: 'No registered practitioner found' });
    }

    let client = await Client.findOne({ email: email.toLowerCase().trim() });
    if (client) {
      return res.status(409).json({
        success: false,
        message: 'A client profile with this email already exists. Please sign in.',
      });
    }

    client = await Client.create({
      therapist_id: therapist._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      status: 'active',
      consent: {
        agreed: true,
        timestamp: new Date(),
        ipAddress: req.ip || '127.0.0.1',
        version: '1.0',
      },
      tags: ['Registered Client'],
    });

    const token = generateToken(client._id);
    res.status(201).json({
      success: true,
      token,
      client: {
        id: client._id,
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        therapist: {
          id: therapist._id,
          _id: therapist._id,
          name: therapist.name,
          slug: therapist.slug,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  clientLogin,
  clientRegister,
};
