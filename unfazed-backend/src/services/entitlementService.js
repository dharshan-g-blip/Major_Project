const Therapist = require('../models/Therapist');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Client = require('../models/Client');

// In-memory fallback config in case DB configs are seeding or bootstrapping
const DEFAULT_CONFIGS = {
  free: {
    tier: 'free',
    displayName: 'Free Starter',
    pricePerMonthINR: 0,
    caps: { activeClients: 5, monthlySessions: 15 },
    features: {
      noteTemplates: ['freeform'],
      analyticsDepth: 'basic_counts',
      canSellPackages: false,
      automatedWhatsApp: false,
      customBranding: false,
      prioritySupport: false,
    },
  },
  starter: {
    tier: 'starter',
    displayName: 'Solo Practitioner',
    pricePerMonthINR: 1499,
    caps: { activeClients: 25, monthlySessions: 100 },
    features: {
      noteTemplates: ['freeform', 'soap'],
      analyticsDepth: 'standard_trends',
      canSellPackages: true,
      automatedWhatsApp: true,
      customBranding: true,
      prioritySupport: false,
    },
  },
  pro: {
    tier: 'pro',
    displayName: 'Clinical Pro',
    pricePerMonthINR: 3499,
    caps: { activeClients: 999999, monthlySessions: 999999 },
    features: {
      noteTemplates: ['freeform', 'soap', 'dap'],
      analyticsDepth: 'advanced_aggregation',
      canSellPackages: true,
      automatedWhatsApp: true,
      customBranding: true,
      prioritySupport: true,
    },
  },
};

/**
 * Centralized Entitlement Service
 * Single source of truth for tier-gating across the entire platform.
 * NEVER check tier strings directly in routes or controllers.
 */
class EntitlementService {
  /**
   * Fetch tier configuration for therapist
   */
  async getTierConfig(therapistId) {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      throw new Error(`Therapist with ID ${therapistId} not found`);
    }

    const tierKey = therapist.subscriptionTier || 'starter';
    let config = await SubscriptionTierConfig.findOne({ tier: tierKey });
    if (!config) {
      config = DEFAULT_CONFIGS[tierKey] || DEFAULT_CONFIGS.starter;
    }

    return { therapist, config };
  }

  /**
   * Main gate check: canAccess(therapistId, featureKey, context)
   */
  async canAccess(therapistId, featureKey, context = {}) {
    const { therapist, config } = await this.getTierConfig(therapistId);

    switch (featureKey) {
      case 'active_client_creation': {
        const currentActiveCount = await Client.countDocuments({
          therapist_id: therapistId,
          status: 'active',
        });
        const cap = config.caps?.activeClients ?? 5;
        const allowed = currentActiveCount < cap;
        return {
          allowed,
          reason: allowed
            ? 'Allowed'
            : `Active client limit reached (${currentActiveCount}/${cap}). Please upgrade your plan.`,
          currentCount: currentActiveCount,
          cap,
          upgradeRequiredTier: therapist.subscriptionTier === 'free' ? 'starter' : 'pro',
        };
      }

      case 'note_template': {
        const requestedTemplate = (context.template || 'freeform').toLowerCase();
        const allowedTemplates = config.features?.noteTemplates || ['freeform'];
        const allowed = allowedTemplates.includes(requestedTemplate);
        return {
          allowed,
          reason: allowed
            ? 'Allowed'
            : `Template '${requestedTemplate.toUpperCase()}' is not available on ${config.displayName}. Upgrade to unlock structured SOAP/DAP templates.`,
          allowedTemplates,
          upgradeRequiredTier: requestedTemplate === 'dap' ? 'pro' : 'starter',
        };
      }

      case 'analytics_depth': {
        const requestedDepth = context.depth || 'standard_trends';
        const userDepth = config.features?.analyticsDepth || 'basic_counts';
        const depthRank = { basic_counts: 1, standard_trends: 2, advanced_aggregation: 3 };
        const allowed = (depthRank[userDepth] || 1) >= (depthRank[requestedDepth] || 2);
        return {
          allowed,
          reason: allowed
            ? 'Allowed'
            : `Advanced aggregation analytics requires Pro tier. Current tier: ${config.displayName}.`,
          currentDepth: userDepth,
          upgradeRequiredTier: 'pro',
        };
      }

      case 'package_sales': {
        const allowed = Boolean(config.features?.canSellPackages);
        return {
          allowed,
          reason: allowed
            ? 'Allowed'
            : `Multi-session package creation requires at least Starter plan.`,
          upgradeRequiredTier: 'starter',
        };
      }

      case 'whatsapp_reminders': {
        const allowed = Boolean(config.features?.automatedWhatsApp);
        return {
          allowed,
          reason: allowed
            ? 'Allowed'
            : `Automated WhatsApp notifications require an active Starter or Pro subscription.`,
          upgradeRequiredTier: 'starter',
        };
      }

      default:
        return {
          allowed: true,
          reason: 'Feature accessible by default',
        };
    }
  }

  /**
   * Return full entitlements payload for frontend useEntitlement hook
   */
  async getTherapistEntitlements(therapistId) {
    const { therapist, config } = await this.getTierConfig(therapistId);
    const activeClientsCount = await Client.countDocuments({
      therapist_id: therapistId,
      status: 'active',
    });

    return {
      tier: therapist.subscriptionTier,
      displayName: config.displayName,
      pricePerMonthINR: config.pricePerMonthINR,
      activeClientsCount,
      activeClientsCap: config.caps?.activeClients ?? 25,
      canCreateClient: activeClientsCount < (config.caps?.activeClients ?? 25),
      allowedNoteTemplates: config.features?.noteTemplates || ['freeform', 'soap'],
      analyticsDepth: config.features?.analyticsDepth || 'standard_trends',
      canSellPackages: Boolean(config.features?.canSellPackages),
      automatedWhatsApp: Boolean(config.features?.automatedWhatsApp),
      customBranding: Boolean(config.features?.customBranding),
    };
  }
}

module.exports = new EntitlementService();
