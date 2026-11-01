import React from 'react';
import { PhoneCall, Heart } from 'lucide-react';

export const CrisisBanner = () => {
  return (
    <div className="bg-amber-50/95 border-b border-amber-200/80 py-2 px-4 text-amber-950 text-[11px]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
        <div className="flex items-center gap-1.5 font-medium">
          <Heart className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 animate-pulse" />
          <span>
            <strong>In Urgent Distress?</strong> 24/7 Crisis Support Resources:
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 font-semibold text-amber-900">
          <span className="flex items-center gap-1 bg-amber-100/70 px-2 py-0.5 rounded-md">
            <PhoneCall className="w-3 h-3 text-amber-700" />
            <span>National Support Line: 1800-000-0000 (Demo Helpline)</span>
          </span>
          <span className="flex items-center gap-1 bg-amber-100/70 px-2 py-0.5 rounded-md">
            <PhoneCall className="w-3 h-3 text-amber-700" />
            <span>Emergency Support Desk: 00000-00000 (Demo Support)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CrisisBanner;
