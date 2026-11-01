const entitlementService = require('../services/entitlementService');

/**
 * Entitlement Tier Gating Middleware Factory
 * Architectural Principle 2.1: No route checks tier strings directly.
 * Everything routes through entitlementService.canAccess(therapistId, featureKey).
 */
const requireEntitlement = (featureKey, extractContext = () => ({})) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist?._id;
      if (!therapistId) {
        return res.status(401).json({ success: false, message: 'Therapist context missing' });
      }

      const context = extractContext(req);
      const access = await entitlementService.canAccess(therapistId, featureKey, context);

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          code: 'UPGRADE_REQUIRED',
          message: access.reason,
          featureKey,
          upgradeRequiredTier: access.upgradeRequiredTier,
          currentCount: access.currentCount,
          cap: access.cap,
        });
      }

      // Attach entitlement check details to request
      req.entitlement = access;
      next();
    } catch (error) {
      console.error('[Entitlement Middleware Error]', error);
      res.status(500).json({ success: false, message: 'Failed to verify tier entitlements' });
    }
  };
};

module.exports = {
  requireEntitlement,
};
