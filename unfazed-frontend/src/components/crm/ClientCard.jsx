import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  FileText,
  CreditCard,
  PackageCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Button from '../common/Button';

export const ClientCard = ({ clientData, onClose, onNewNoteClick }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!clientData) return null;
  const { client, sessions = [], notes = [], payments = [], packages = [] } = clientData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      {/* Top Banner & Client Header */}
      <div className="p-6 bg-gradient-to-r from-teal-900 to-teal-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{client.name}</h3>
            <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-teal-100">
              {client.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-teal-200 mt-2">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {client.email}
            </span>
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {client.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNewNoteClick && (
            <Button size="sm" variant="secondary" onClick={() => onNewNoteClick(client)}>
              Add Clinical Note
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Back to List
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 flex items-center space-x-6 text-xs font-semibold text-slate-600">
        {[
          { id: 'overview', label: 'Clinical Intake & Consent' },
          { id: 'sessions', label: `Sessions (${sessions.length})` },
          { id: 'notes', label: `Clinical Notes (${notes.length})` },
          { id: 'billing', label: `Invoices & Payments (${payments.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-teal-800 text-teal-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6 text-xs">
            {/* Auditable Digital Consent */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Auditable Informed Digital Consent</h4>
                <p className="text-emerald-700 mt-0.5">
                  Status:{' '}
                  <strong>{client.consent?.agreed ? 'Verified & Signed' : 'Pending Signature'}</strong> • Version:{' '}
                  {client.consent?.version || '1.0'}
                </p>
                {client.consent?.timestamp && (
                  <p className="text-emerald-600 text-[11px] mt-1">
                    Captured at: {new Date(client.consent.timestamp).toLocaleString('en-IN')} (IP:{' '}
                    {client.consent.ipAddress || '127.0.0.1'})
                  </p>
                )}
              </div>
            </div>

            {/* Intake Form Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Demographics & Emergency Info
                </h5>
                <div className="space-y-1 text-slate-600">
                  <p>
                    <strong className="text-slate-700">Occupation:</strong>{' '}
                    {client.intakeForm?.occupation || 'Not specified'}
                  </p>
                  <p>
                    <strong className="text-slate-700">Date of Birth:</strong>{' '}
                    {client.intakeForm?.dob || 'Not specified'}
                  </p>
                  <p>
                    <strong className="text-slate-700">Emergency Contact:</strong>{' '}
                    {client.intakeForm?.emergencyContact || 'Not specified'} (
                    {client.intakeForm?.emergencyPhone || 'N/A'})
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Presenting Concern & Therapy Goals
                </h5>
                <div className="space-y-1 text-slate-600">
                  <p>
                    <strong className="text-slate-700">Concern:</strong>{' '}
                    {client.intakeForm?.presentingConcern || 'Initial consultation'}
                  </p>
                  <p>
                    <strong className="text-slate-700">Client Goals:</strong>{' '}
                    {client.intakeForm?.goals || 'Symptom reduction and insight'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Packages */}
            {packages.length > 0 && (
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                <h5 className="font-bold text-purple-900 flex items-center gap-1.5 mb-2">
                  <PackageCheck className="w-4 h-4 text-purple-700" />
                  <span>Active Session Package Balance</span>
                </h5>
                {packages.map((cp) => (
                  <div key={cp._id} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{cp.packageName}</span>
                      <div className="text-[11px] text-slate-500">
                        Expires:{' '}
                        {new Date(cp.expiresAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-purple-800">
                        {cp.remainingSessions} / {cp.totalSessions}
                      </span>
                      <span className="text-[11px] text-slate-500 block">sessions left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-3 text-xs">
            {sessions.map((s) => (
              <div
                key={s._id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{s.sessionType}</div>
                  <div className="text-slate-500">
                    {new Date(s.startTime).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {s.status}
                  </span>
                  <span className="font-bold text-slate-800">₹{s.fee}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4 text-xs">
            {notes.map((note) => (
              <div
                key={note._id}
                className={`p-4 rounded-xl border ${
                  note.type === 'private'
                    ? 'border-amber-200/80 bg-amber-50/20'
                    : 'border-teal-200/80 bg-teal-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 text-sm">{note.title}</h5>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        note.type === 'private'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-teal-100 text-teal-900'
                      }`}
                    >
                      {note.type} ({note.format})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {note.format === 'soap' ? (
                  <div className="space-y-1.5 text-slate-700">
                    <p><strong>S:</strong> {note.soap?.subjective}</p>
                    <p><strong>O:</strong> {note.soap?.objective}</p>
                    <p><strong>A:</strong> {note.soap?.assessment}</p>
                    <p><strong>P:</strong> {note.soap?.plan}</p>
                  </div>
                ) : note.format === 'dap' ? (
                  <div className="space-y-1.5 text-slate-700">
                    <p><strong>Data:</strong> {note.dap?.data}</p>
                    <p><strong>Assessment:</strong> {note.dap?.assessment}</p>
                    <p><strong>Plan:</strong> {note.dap?.plan}</p>
                  </div>
                ) : (
                  <div
                    className="prose prose-sm text-slate-700 max-w-none"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-3 text-xs">
            {payments.map((p) => (
              <div
                key={p._id}
                className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">{p.invoice_number || 'INV-2026'}</span>
                  <div className="text-[11px] text-slate-500">
                    {p.description} • Mode: {p.payment_method}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 text-sm">₹{p.amount}</span>
                  {p.invoice_url && (
                    <a
                      href={p.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      <span>Invoice PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCard;
