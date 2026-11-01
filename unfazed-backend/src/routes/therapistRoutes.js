const express = require('express');
const router = express.Router();
const {
  getPublicProfile,
  updateProfile,
  upgradeSubscriptionTier,
  getSubscriptionPlans,
  getAllTherapists,
} = require('../controllers/therapistController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route for branded link (e.g. unfazed.in/dr-sharma)
router.get('/all', getAllTherapists);
router.get('/profile/:slug', getPublicProfile);
router.get('/subscription-plans', getSubscriptionPlans);

// Protected routes
router.put('/profile', authMiddleware, updateProfile);
router.post('/upgrade-tier', authMiddleware, upgradeSubscriptionTier);

module.exports = router;
