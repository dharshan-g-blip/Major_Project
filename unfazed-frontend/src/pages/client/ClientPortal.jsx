import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import ChatWindow from '../../components/chat/ChatWindow';
import InvoiceView from '../../components/payments/InvoiceView';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { getDoctorCardMeta } from '../../utils/doctorMeta';
import {
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  Video,
  ShieldCheck,
  PackageCheck,
  ExternalLink,
  Lock,
  Share2,
  Users,
  Info,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const ClientPortal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clientUser } = useAuth();
  const clientEmail = clientUser?.email || searchParams.get('email') || 'rohan.verma@example.com';
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [therapistAvatarError, setTherapistAvatarError] = useState(false);

  const fetchPortalData = async (email) => {
    if (!email) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/clients/portal/me', {
        params: { email },
      });
      if (res.data.success) {
        setPortalData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'No client record found for this email');
      setPortalData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData(clientEmail);
  }, [clientEmail]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Clean Sanctuary Header (No duplicate switchers or search inputs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Confidential Client Sanctuary</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Serenova Client Sanctuary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your private space for upcoming therapy sessions, shared homework exercises, invoices, and direct practitioner chat.
          </p>
        </div>

        <Link
          to={`/${portalData?.therapist?.slug || 'overview#doctors'}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book New Session</span>
        </Link>
      </div>

      {loading && <Loader message="Accessing secure client records..." size="md" />}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs text-center">
          {errorMsg}
        </div>
      )}

      {portalData && !loading && (
        <div className="space-y-6">
          {/* Welcome Card & Therapist Header */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white flex flex-col items-center justify-center font-bold text-sm ring-2 ring-teal-700/20 shadow-xs select-none flex-shrink-0">
                <span className="text-base font-black">
                  {getDoctorCardMeta(portalData.therapist?.name).initials}
                </span>
                <span className="text-[9px] text-teal-200 font-medium">Doctor</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Welcome back, <span className="text-teal-900">{portalData.client.name}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Therapy Partner: <strong>{portalData.therapist?.name}</strong> •{' '}
                  {portalData.therapist?.qualifications}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                to={`/${portalData.therapist?.slug || 'dr-sharma'}`}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200/60 transition-colors flex items-center gap-1.5"
              >
                <span>Book New Session</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            {[
              { id: 'appointments', label: 'My Sessions', icon: Calendar },
              { id: 'notes', label: 'Shared Notes & Homework', icon: Share2 },
              { id: 'chat', label: 'Live Practitioner Chat', icon: MessageSquare },
              { id: 'invoices', label: 'Invoices & Billing', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Appointments (Divided into Upcoming and Previous) */}
          {activeTab === 'appointments' && (() => {
            const upcomingSessions = portalData.sessions?.filter((s) => 
              (s.status === 'scheduled' || s.status === 'confirmed') && 
              (s.paymentStatus === 'paid' || s.paymentStatus === 'completed' || s.status === 'confirmed' || s.status === 'scheduled')
            ) || [];
            const previousSessions = portalData.sessions?.filter((s) => s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show') || [];

            return (
              <div className="space-y-8">
                {/* 1. Upcoming Scheduled Sessions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-extrabold text-slate-900 text-sm">Upcoming Scheduled Sessions</h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {upcomingSessions.length} Confirmed
                    </span>
                  </div>

                  {upcomingSessions.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-3">
                      <p>No upcoming sessions scheduled right now.</p>
                      <Link
                        to={`/${portalData.therapist?.slug || 'dr-sharma'}`}
                        className="inline-block px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-900"
                      >
                        Book a Session
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingSessions.map((s) => {
                        const start = new Date(s.startTime);
                        return (
                          <div
                            key={s._id}
                            className="p-5 rounded-3xl border border-teal-700/50 bg-gradient-to-br from-white to-teal-50/40 shadow-xs flex flex-col justify-between space-y-4 ring-1 ring-teal-700/10"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Confirmed Appointment
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">₹{s.fee}</span>
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-sm">{s.sessionType}</h4>
                              <p className="text-xs text-slate-600 font-medium mt-1">
                                {start.toLocaleString('en-IN', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}{' '}
                                • {s.durationMinutes} mins
                              </p>
                            </div>

                            <Link
                              to={`/meet/${s._id}`}
                              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-teal-950/10 transition-all"
                            >
                              <Video className="w-4 h-4" />
                              <span>Join Virtual Therapy Room</span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Previous Sessions & History (Kept in clean separate section) */}
                <div className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 text-sm">Previous Sessions & History</h3>
                    <span className="text-xs text-slate-500">
                      {previousSessions.length} Past Completed
                    </span>
                  </div>

                  {previousSessions.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                      No completed session records yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previousSessions.map((s) => {
                        const start = new Date(s.startTime);
                        return (
                          <div
                            key={s._id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                  {s.status}
                                </span>
                                <span className="text-xs font-bold text-slate-700">₹{s.fee} • Paid</span>
                              </div>

                              <h4 className="font-bold text-slate-800 text-xs">{s.sessionType}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {start.toLocaleString('en-IN', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}{' '}
                                ({s.durationMinutes} mins)
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-teal-800 font-semibold">
                              <button
                                type="button"
                                onClick={() => setActiveTab('invoices')}
                                className="hover:underline flex items-center gap-1"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> View Receipt
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab('notes')}
                                className="hover:underline flex items-center gap-1"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Homework Notes
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Tab 2: Shared Notes (Zero Private Notes Leakage) */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-start gap-3">
                <Share2 className="w-5 h-5 text-teal-800 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider">
                    Shared Clinical Homework & Reflections
                  </h4>
                  <p className="text-xs text-teal-800/90 mt-0.5">
                    Your therapist shares thought records, psychoeducation worksheets, and action plans here for
                    your review between sessions.
                  </p>
                </div>
              </div>

              {portalData.sharedNotes?.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No shared notes published yet. They will appear here after your sessions.
                </div>
              ) : (
                <div className="space-y-4">
                  {portalData.sharedNotes?.map((note) => (
                    <div
                      key={note._id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 text-base">{note.title}</h4>
                        <span className="text-xs text-slate-400">
                          {new Date(note.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div
                        className="prose prose-sm text-slate-700 max-w-none text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />

                      {note.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {note.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Real-Time Chat Window */}
          {activeTab === 'chat' && (
            <div className="max-w-2xl mx-auto">
              <ChatWindow
                key={`chat_${portalData.therapist?._id || portalData.therapist?.id}_${portalData.client?._id || portalData.client?.id}`}
                roomId={`room_${portalData.therapist?._id || portalData.therapist?.id}_${portalData.client?._id || portalData.client?.id}`}
                userType="client"
                userName={portalData.client.name}
                userId={portalData.client?._id || portalData.client?.id}
              />
            </div>
          )}

          {/* Tab 4: Invoices & Payments */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">GST Tax Invoices & Receipts</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {portalData.payments?.map((payment) => (
                  <InvoiceView key={payment._id} payment={payment} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
