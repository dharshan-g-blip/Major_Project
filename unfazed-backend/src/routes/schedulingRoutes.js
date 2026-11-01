const express = require('express');
const router = express.Router();
const {
  getMyAvailability,
  updateAvailability,
  getOpenSlots,
  bookSlot,
  joinWaitlist,
  getTherapistSessions,
  updateSessionStatus,
  cancelBooking,
} = require('../controllers/schedulingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Client Booking Routes
router.get('/open-slots/:slug', getOpenSlots);
router.post('/book', bookSlot);
router.post('/cancel', cancelBooking);
router.post('/waitlist', joinWaitlist);

// Protected Therapist Scheduling Routes
router.get('/availability', authMiddleware, getMyAvailability);
router.put('/availability', authMiddleware, updateAvailability);
router.get('/sessions', authMiddleware, getTherapistSessions);
router.patch('/sessions/:id', authMiddleware, updateSessionStatus);

module.exports = router;
