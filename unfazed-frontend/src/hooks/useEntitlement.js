import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useEntitlement = () => {
  const { entitlements, upgradeTier, user } = useAuth();
  const [blockedModalState, setBlockedModalState] = useState({
    isOpen: false,
    title: '',
    reason: '',
    requiredTier: 'starter',
    featureKey: '',
  });

  const triggerUpgradePrompt = ({ title, reason, requiredTier, featureKey }) => {
    setBlockedModalState({
      isOpen: true,
      title: title || 'Upgrade Required',
      reason: reason || 'This feature is not available on your current plan.',
      requiredTier: requiredTier || 'starter',
      featureKey: featureKey || '',
    });
  };

  const closeUpgradePrompt = () => {
    setBlockedModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Checks for Note Templates (freeform, soap, dap)
  const checkNoteTemplateAccess = (template) => {
    if (!entitlements) return true;
    const allowed = entitlements.allowedNoteTemplates?.includes(template.toLowerCase());
    if (!allowed) {
      triggerUpgradePrompt({
        title: `Unlock ${template.toUpperCase()} Clinical Templates`,
        reason: `Structured ${template.toUpperCase()} clinical documentation requires a ${template.toLowerCase() === 'dap' ? 'Pro' : 'Starter'} tier subscription.`,
        requiredTier: template.toLowerCase() === 'dap' ? 'pro' : 'starter',
        featureKey: 'note_template',
      });
      return false;
    }
    return true;
  };

  // Checks for Active Client Creation Limit
  const checkCanCreateClient = () => {
    if (!entitlements) return true;
    if (!entitlements.canCreateClient) {
      triggerUpgradePrompt({
        title: 'Active Client Cap Reached',
        reason: `You have reached the limit of ${entitlements.activeClientsCap} active clients on your ${entitlements.displayName}. Upgrade to expand your practice capacity.`,
        requiredTier: entitlements.tier === 'free' ? 'starter' : 'pro',
        featureKey: 'active_client_creation',
      });
      return false;
    }
    return true;
  };

  // Checks for Package Sales
  const checkPackageSalesAccess = () => {
    if (!entitlements) return true;
    if (!entitlements.canSellPackages) {
      triggerUpgradePrompt({
        title: 'Unlock Multi-Session Packages',
        reason: 'Selling bundled 3, 6, or 12 session packages requires the Solo Practitioner (Starter) plan.',
        requiredTier: 'starter',
        featureKey: 'package_sales',
      });
      return false;
    }
    return true;
  };

  // Checks for Advanced Analytics Depth
  const checkAnalyticsDepthAccess = (requestedDepth = 'advanced_aggregation') => {
    if (!entitlements) return true;
    if (requestedDepth === 'advanced_aggregation' && entitlements.analyticsDepth !== 'advanced_aggregation') {
      triggerUpgradePrompt({
        title: 'Unlock Advanced Practice Analytics',
        reason: 'Cohort retention, no-show predictive breakdown, and advanced practice business intelligence require the Clinical Pro plan.',
        requiredTier: 'pro',
        featureKey: 'analytics_depth',
      });
      return false;
    }
    return true;
  };

  return {
    entitlements,
    currentTier: user?.subscriptionTier || entitlements?.tier || 'starter',
    checkNoteTemplateAccess,
    checkCanCreateClient,
    checkPackageSalesAccess,
    checkAnalyticsDepthAccess,
    blockedModalState,
    triggerUpgradePrompt,
    closeUpgradePrompt,
    upgradeTier,
  };
};

export default useEntitlement;
