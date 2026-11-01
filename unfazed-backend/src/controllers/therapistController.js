const Therapist = require('../models/Therapist');
const Package = require('../models/Package');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const { generateUniqueSlug } = require('../utils/generateSlug');
const entitlementService = require('../services/entitlementService');

// @desc    Get public therapist profile by slug
// @route   GET /api/therapist/:slug
const getPublicProfile = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const therapist = await Therapist.findOne({ slug: slug.toLowerCase() }).select(
      'name slug bio specializations languages qualifications experienceYears sessionFee bufferTime allowedDurations avatarUrl clinicAddress phone'
    );

    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist profile not found' });
    }

    const packages = await Package.find({
      therapist_id: therapist._id,
      isActive: true,
    }).sort({ sessionCount: 1 });

    const openGraph = {
      title: `${therapist.name} | Licensed Clinical Psychologist - Unfazed`,
      description: therapist.bio || `Book online therapy sessions directly with ${therapist.name}. Specializing in ${therapist.specializations.join(', ')}.`,
      image: therapist.avatarUrl,
      url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/${therapist.slug}`,
    };

    res.json({
      success: true,
      therapist,
      packages,
      openGraph,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update therapist profile
// @route   PUT /api/therapist/profile
const updateProfile = async (req, res, next) => {
  try {
    const therapist = req.therapist;
    const {
      name,
      bio,
      specializations,
      languages,
      qualifications,
      experienceYears,
      sessionFee,
      bufferTime,
      allowedDurations,
      avatarUrl,
      phone,
      clinicAddress,
      desiredSlug,
    } = req.body;

    if (name) therapist.name = name;
    if (bio !== undefined) therapist.bio = bio;
    if (specializations) {
      therapist.specializations = Array.isArray(specializations)
        ? specializations
        : String(specializations)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (languages) {
      therapist.languages = Array.isArray(languages)
        ? languages
        : String(languages)
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean);
    }
    if (qualifications) therapist.qualifications = qualifications;
    if (experienceYears !== undefined) therapist.experienceYears = Number(experienceYears) || 0;
    if (sessionFee !== undefined) therapist.sessionFee = Number(sessionFee) || 0;
    if (bufferTime !== undefined) therapist.bufferTime = Number(bufferTime) || 0;
    if (allowedDurations) {
      therapist.allowedDurations = Array.isArray(allowedDurations)
        ? allowedDurations.map(Number).filter(Boolean)
        : String(allowedDurations)
            .split(',')
            .map((d) => Number(d.trim()))
            .filter(Boolean);
    }
    if (avatarUrl) therapist.avatarUrl = avatarUrl;
    if (phone) therapist.phone = phone;
    if (clinicAddress) therapist.clinicAddress = clinicAddress;

    if (desiredSlug && desiredSlug !== therapist.slug) {
      therapist.slug = await generateUniqueSlug(desiredSlug, Therapist, therapist._id);
    }

    await therapist.save();
    const entitlements = await entitlementService.getTherapistEntitlements(therapist._id);

    res.json({
      success: true,
      therapist,
      entitlements,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change subscription tier (for tier demo / upgrade flow)
// @route   POST /api/therapist/upgrade-tier
const upgradeSubscriptionTier = async (req, res, next) => {
  try {
    const therapist = req.therapist;
    const { targetTier } = req.body;

    if (!['free', 'starter', 'pro'].includes(targetTier)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription tier' });
    }

    therapist.subscriptionTier = targetTier;
    await therapist.save();

    const entitlements = await entitlementService.getTherapistEntitlements(therapist._id);

    res.json({
      success: true,
      message: `Subscription successfully updated to ${targetTier.toUpperCase()}`,
      therapist,
      entitlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available subscription tiers config
// @route   GET /api/therapist/subscription-plans
const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionTierConfig.find().sort({ pricePerMonthINR: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all licensed therapists for directory / overview showcase
// @route   GET /api/therapist/all
const getAllTherapists = async (req, res, next) => {
  try {
    const therapists = await Therapist.find().select(
      'name slug bio specializations languages qualifications experienceYears sessionFee bufferTime avatarUrl clinicAddress phone'
    );
    res.json({ success: true, therapists });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicProfile,
  updateProfile,
  upgradeSubscriptionTier,
  getSubscriptionPlans,
  getAllTherapists,
};
