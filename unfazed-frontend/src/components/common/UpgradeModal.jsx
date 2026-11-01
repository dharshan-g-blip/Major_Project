import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UpgradeModal = ({ isOpen, onClose, state }) => {
  const { upgradeTier, entitlements } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '₹0',
      period: '/mo',
      badge: 'Current',
      features: ['Up to 5 active clients', 'Freeform clinical notes', 'Basic appointment counts'],
    },
    {
      id: 'starter',
      name: 'Solo Practitioner',
      price: '₹1,499',
      period: '/mo',
      badge: 'Popular',
      features: [
        'Up to 25 active clients',
        'Structured SOAP note templates',
        'Multi-session package bundles',
        'Automated WhatsApp reminders',
        'Monthly revenue trends',
      ],
    },
    {
      id: 'pro',
      name: 'Clinical Pro',
      price: '₹3,499',
      period: '/mo',
      badge: 'Recommended',
      features: [
        'Unlimited active clients',
        'Both SOAP & DAP templates',
        'Advanced cohort analytics & forecasting',
        'Priority client intake & waitlists',
        'Custom branding & priority support',
      ],
    },
  ];

  const handleUpgrade = async (tierId) => {
    try {
      setLoading(true);
      await upgradeTier(tierId);
      setSuccessMsg(`Successfully upgraded to ${tierId.toUpperCase()}! You now have immediate access.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade Your Practice Plan" maxWidth="max-w-3xl">
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900">{state.title || 'Feature Locked'}</h4>
            <p className="text-sm text-amber-700 mt-0.5">{state.reason}</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm text-center font-medium animate-fade-in">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = entitlements?.tier === plan.id;
            const isTarget = state.requiredTier === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-5 border flex flex-col justify-between transition-all ${
                  isTarget
                    ? 'border-teal-600 bg-teal-50/20 shadow-md ring-2 ring-teal-600/30'
                    : isCurrent
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isTarget && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                    Unlocks This Feature
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold text-slate-800">{plan.name}</h5>
                  </div>
                  <div className="flex items-baseline mb-4">
                    <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500 ml-1">{plan.period}</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 mb-6">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : isTarget ? 'primary' : 'outline'}
                  disabled={isCurrent || loading}
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full"
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${plan.name.split(' ')[0]}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
