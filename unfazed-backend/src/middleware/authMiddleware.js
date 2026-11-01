const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'unfazed_jwt_secret_super_secure_key_2026'
    );

    const therapist = await Therapist.findById(decoded.id).select('-password_hash');
    if (!therapist) {
      return res.status(401).json({
        success: false,
        message: 'Therapist account not found or deactivated',
      });
    }

    req.therapist = therapist;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: token verification failed',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
