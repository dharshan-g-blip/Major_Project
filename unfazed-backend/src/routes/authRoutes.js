const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  clientLogin,
  clientRegister,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Therapist Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

// Client / Patient Auth Routes
router.post('/client/login', clientLogin);
router.post('/client/register', clientRegister);

module.exports = router;
