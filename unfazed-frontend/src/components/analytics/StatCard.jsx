import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'teal' }) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-800 border-teal-100',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    rose: 'bg-rose-50 text-rose-800 border-rose-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorMap[color] || colorMap.teal}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[11px] text-emerald-600 font-semibold">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
