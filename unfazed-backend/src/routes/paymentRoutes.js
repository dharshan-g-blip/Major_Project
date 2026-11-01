const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  downloadInvoice,
  getTherapistPayments,
  createPackage,
  getTherapistPackages,
  verifyCoupon,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireEntitlement } = require('../middleware/entitlementMiddleware');

// Public Payment Gateway, Discount Coupons & Invoice endpoints
router.post('/verify-coupon', verifyCoupon);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/invoice/:filename', downloadInvoice);

// Protected Therapist Payment Ledger & Package routes
router.get('/therapist', authMiddleware, getTherapistPayments);
router.get('/packages', authMiddleware, getTherapistPackages);
router.post('/packages', authMiddleware, requireEntitlement('package_sales'), createPackage);

module.exports = router;
