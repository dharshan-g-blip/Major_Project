import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import StatCard from '../../components/analytics/StatCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import UpgradeModal from '../../components/common/UpgradeModal';
import useEntitlement from '../../hooks/useEntitlement';
import {
  BarChart3,
  CreditCard,
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  Lock,
  Layers,
} from 'lucide-react';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depthMode, setDepthMode] = useState('standard_trends');

  const {
    checkAnalyticsDepthAccess,
    blockedModalState,
    closeUpgradePrompt,
    entitlements,
  } = useEntitlement();

  const fetchAnalytics = async (depth) => {
    try {
      setLoading(true);
      const res = await api.get('/analytics', { params: { depth } });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(depthMode);
  }, [depthMode]);

  const handleToggleDepth = (newDepth) => {
    if (newDepth === 'advanced_aggregation') {
      const allowed = checkAnalyticsDepthAccess('advanced_aggregation');
      if (!allowed) return;
    }
    setDepthMode(newDepth);
  };

  if (loading) return <Loader message="Analyzing clinical metrics & revenue trends..." size="lg" />;

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <UpgradeModal
        isOpen={blockedModalState.isOpen}
        onClose={closeUpgradePrompt}
        state={blockedModalState}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-800" />
            <span>Practice Business Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time practice performance metrics computing consultation revenue, clinical retention, and attendance rates.
          </p>
        </div>

        {/* Analytics Depth Switcher (Gated by Tier!) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => handleToggleDepth('standard_trends')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              depthMode === 'standard_trends'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Standard Trends
          </button>

          <button
            onClick={() => handleToggleDepth('advanced_aggregation')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              depthMode === 'advanced_aggregation'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-purple-900 hover:bg-purple-50'
            }`}
          >
            {entitlements?.analyticsDepth === 'advanced_aggregation' ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-purple-700" />
            )}
            <span>Pro Cohort Insights</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Practice Income"
          value={`₹${(summary.totalNetRevenue || 0).toLocaleString('en-IN')}`}
          subtext="Excluding gateway commissions"
          icon={CreditCard}
          color="teal"
        />

        <StatCard
          title="Gross Bookings Value"
          value={`₹${(summary.totalGrossRevenue || 0).toLocaleString('en-IN')}`}
          subtext="Total transaction volume"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Clinical No-Show Rate"
          value={`${summary.noShowRate || 0}%`}
          subtext="Practice attendance & retention"
          icon={Calendar}
          color={summary.noShowRate > 15 ? 'rose' : 'amber'}
        />

        <StatCard
          title="Patient Roster"
          value={`${summary.activeClients || 0} active`}
          subtext={`of ${summary.totalClients || 0} registered clients`}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Aggregated Visualizations */}
      <RevenueChart
        revenueTrend={charts.revenueTrend || []}
        sessionBreakdown={charts.sessionBreakdown || []}
        sessionTypes={charts.sessionTypes || []}
      />

      {/* Service Types Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-3">Service Modalities & Revenue Contribution</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Modality / Service</th>
                <th className="py-2.5 px-4 text-center">Sessions Delivered</th>
                <th className="py-2.5 px-4 text-right">Revenue Contributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {charts.sessionTypes?.map((st, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{st.sessionType}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{st.count}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-900">
                    ₹{(st.revenue || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
