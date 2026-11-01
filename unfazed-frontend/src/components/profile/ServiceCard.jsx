import React from 'react';
import { Check, Zap, Calendar, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export const ServiceCard = ({ therapist, packages, onSelectService, onSelectPackage }) => {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Consultation Packages</h2>
        <p className="text-slate-500 text-sm mt-1">
          Choose between individual single sessions or discounted multi-session therapeutic bundles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Single Session Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>Pay Per Session</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Individual Psychotherapy</h3>
            <p className="text-xs text-slate-500 mt-1">
              One-on-one virtual or in-person clinical hour focusing on your immediate presenting concern.
            </p>

            <div className="mt-4 mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">₹{therapist.sessionFee || 2000}</span>
                <span className="text-xs text-slate-500">/ 50 mins</span>
              </div>
              <span className="text-[11px] text-teal-700 font-medium">Includes intake review & post-session summary</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Confidential video consultation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Instant Google Meet calendar invite</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>GST Tax Invoice provided</span>
              </li>
            </ul>
          </div>

          <Button
            variant="outline"
            onClick={() => onSelectService({ type: 'single', fee: therapist.sessionFee || 2000 })}
            className="w-full"
          >
            Select Single Session
          </Button>
        </div>

        {/* Multi-Session Packages */}
        {packages?.map((pkg) => {
          const isPopular = pkg.sessionCount === 6;

          return (
            <div
              key={pkg._id}
              className={`relative bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                isPopular
                  ? 'border-teal-700 shadow-md ring-2 ring-teal-700/20'
                  : 'border-slate-200 shadow-xs hover:shadow-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-800 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Most Recommended</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800">
                    <Zap className="w-3.5 h-3.5 text-teal-700" />
                    <span>{pkg.sessionCount} Sessions Bundle</span>
                  </div>
                  {pkg.discountPercentage > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Save {pkg.discountPercentage}%
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>

                <div className="mt-4 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹{pkg.totalPrice}</span>
                    <span className="text-xs text-slate-500">total</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ₹{pkg.perSessionRate} per session • Valid {pkg.validityDays} days
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Priority calendar slot booking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Flexible schedule at your own pace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Client Portal homework & shared notes</span>
                  </li>
                </ul>
              </div>

              <Button
                variant={isPopular ? 'primary' : 'outline'}
                onClick={() => onSelectPackage(pkg)}
                className="w-full"
              >
                Choose {pkg.sessionCount}-Session Bundle
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceCard;
