import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/analytics/StatCard';
import ChatWindow from '../../components/chat/ChatWindow';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Video,
  Copy,
  ExternalLink,
  Bell,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const Dashboard = () => {
  const { user, entitlements } = useAuth();
  const toast = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [notifLogs, setNotifLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedChatClient, setSelectedChatClient] = useState(null);
  const [showFeatureGuide, setShowFeatureGuide] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, sessionsRes, clientsRes, notifRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/scheduling/sessions', { params: { status: 'scheduled' } }),
          api.get('/clients', { params: { status: 'active' } }),
          api.get('/notifications/logs'),
        ]);

        if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
        if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions || []);
        if (clientsRes.data.success) {
          setClients(clientsRes.data.clients || []);
          if (clientsRes.data.clients?.length > 0) {
            setSelectedChatClient(clientsRes.data.clients[0]);
          }
        }
        if (notifRes.data.success) setNotifLogs(notifRes.data.logs || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const copyBrandedLink = () => {
    const url = `${window.location.origin}/${user?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Branded link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loader message="Compiling practice overview..." size="lg" />;

  const summary = analytics?.summary || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Branded Practice Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user?.qualifications || 'Licensed Clinical Practice'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl">
              Your practice is active on the <strong>{user?.subscriptionTier?.toUpperCase()}</strong> plan with{' '}
              {entitlements?.activeClientsCount} active clients.
            </p>
          </div>

          {/* Branded Share Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
            <div>
              <span className="text-[10px] text-teal-200 uppercase font-bold tracking-wider block">
                Your Public Booking Link
              </span>
              <span className="font-mono text-xs text-white font-semibold">
                serenova.care/{user?.slug}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyBrandedLink}
                className="px-3 py-1.5 bg-white text-teal-900 hover:bg-teal-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <a
                href={`/${user?.slug}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                title="Open client page"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Practice Revenue"
          value={`₹${(summary.totalNetRevenue || 0).toLocaleString('en-IN')}`}
          subtext={`Gross: ₹${(summary.totalGrossRevenue || 0).toLocaleString('en-IN')}`}
          icon={CreditCard}
          trend="+18% vs last quarter"
          color="teal"
        />

        <StatCard
          title="Active Practice Clients"
          value={`${summary.activeClients || 0} / ${entitlements?.activeClientsCap === 999999 ? '∞' : entitlements?.activeClientsCap}`}
          subtext="Under active clinical care"
          icon={Users}
          color="emerald"
        />

        <StatCard
          title="Upcoming Sessions"
          value={summary.scheduledUpcoming || sessions.length}
          subtext="Confirmed bookings"
          icon={Calendar}
          color="purple"
        />

        <StatCard
          title="Practice No-Show Rate"
          value={`${summary.noShowRate || 0}%`}
          subtext="Session attendance & retention rate"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Main Working Grid: Sessions & Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Upcoming Appointments & Notifications Log */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Sessions Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500">Next confirmed therapy sessions</p>
              </div>
              <Link
                to="/therapist/schedule"
                className="text-xs font-bold text-teal-800 hover:text-teal-900"
              >
                View Full Calendar →
              </Link>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No appointments scheduled for today. Share your link to receive new bookings!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.slice(0, 4).map((s) => {
                  const start = new Date(s.startTime);
                  return (
                    <div
                      key={s._id}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-900 font-extrabold text-sm">
                          {start.getDate()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{s.clientName}</h4>
                          <p className="text-[11px] text-slate-500">
                            {start.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}{' '}
                            • {s.sessionType}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/meet/${s._id}`}
                          className="p-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Start Meet</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Event-Driven Notifications Audit Stream (Module 6) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-800" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Communication & Notification Logs</h3>
                  <p className="text-xs text-slate-500">
                    Real-time delivery log of appointment confirmations & reminders
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                Automated Messaging Active
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {notifLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Notification queue is clear. Events will appear when bookings or sessions trigger.
                </div>
              ) : (
                notifLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.channel === 'whatsapp_stub'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.channel === 'whatsapp_stub' ? 'WhatsApp' : 'Email'}
                        </span>
                        <span className="font-semibold text-slate-800 capitalize">
                          {log.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        Recipient: <strong>{log.recipient}</strong>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Patient Chat */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-800" />
              <span>Patient Chat Hub</span>
            </h3>
            {clients.length > 1 && (
              <select
                value={selectedChatClient?._id || ''}
                onChange={(e) => {
                  const c = clients.find((x) => x._id === e.target.value);
                  if (c) setSelectedChatClient(c);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
              >
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedChatClient ? (
            <ChatWindow
              key={`chat_${user?._id || user?.id}_${selectedChatClient._id || selectedChatClient.id}`}
              roomId={`room_${user?._id || user?.id}_${selectedChatClient._id || selectedChatClient.id}`}
              userType="therapist"
              userName={user?.name || 'Dr. Sharma'}
              userId={user?._id || user?.id}
            />
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No active clients found to start conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
