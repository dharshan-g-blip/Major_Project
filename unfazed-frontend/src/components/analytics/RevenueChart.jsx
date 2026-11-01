import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const RevenueChart = ({ revenueTrend = [], sessionBreakdown = [], sessionTypes = [] }) => {
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Revenue Trend (MongoDB Aggregation) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Monthly Practice Revenue</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified monthly revenue overview from completed patient appointments
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg">
            INR (₹)
          </span>
        </div>

        <div className="h-64 w-full">
          {revenueTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No revenue records yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="grossRevenue" name="Gross Bookings" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netRevenue" name="Net Practitioner Revenue" fill="#115E59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Session Status Pie / Donut Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Session Outcomes & Attendance</h4>
          <p className="text-xs text-slate-500 mt-0.5">Distribution across scheduled and completed hours</p>
        </div>

        <div className="h-52 w-full my-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sessionBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {sessionBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
          {sessionBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>
                {item.name}: <strong>{item.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
