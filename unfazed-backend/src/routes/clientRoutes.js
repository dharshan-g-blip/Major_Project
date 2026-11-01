const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  getClientPortalData,
  submitDigitalConsent,
} = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireEntitlement } = require('../middleware/entitlementMiddleware');

// Client Portal & Intake Public Routes
router.get('/portal/me', getClientPortalData);
router.post('/consent', submitDigitalConsent);

// Protected Therapist CRM Routes
router.get('/', authMiddleware, getClients);
router.get('/:id', authMiddleware, getClientById);
// Tier-gated client creation:
router.post('/', authMiddleware, requireEntitlement('active_client_creation'), createClient);
router.put('/:id', authMiddleware, updateClient);

module.exports = router;
