import React from 'react';
import { FileText, Download, CheckCircle, ExternalLink } from 'lucide-react';
import Button from '../common/Button';

export const InvoiceView = ({ payment }) => {
  if (!payment) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-800" />
          <h4 className="font-bold text-slate-900 text-sm">
            Tax Invoice #{payment.invoice_number}
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          <span>Paid</span>
        </span>
      </div>

      <div className="bg-slate-50/90 border border-slate-100 p-4 rounded-2xl space-y-3 text-xs text-slate-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
          <div className="min-w-0 pr-2 flex-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Transaction ID
            </span>
            <span className="font-mono text-slate-800 text-[11px] font-semibold break-all select-all block">
              {payment.gateway_transaction_id}
            </span>
          </div>
          <div className="sm:text-right flex-shrink-0 pt-1 sm:pt-0">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Amount Paid
            </span>
            <span className="font-extrabold text-emerald-800 text-base">
              ₹{(payment.amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Service Code (SAC)
            </span>
            <span className="text-slate-700 font-medium text-xs">999312 (Psychotherapy)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Date of Issue
            </span>
            <span className="text-slate-700 font-medium text-xs">
              {new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {payment.invoice_url && (
        <a
          href={payment.invoice_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download GST Invoice PDF</span>
        </a>
      )}
    </div>
  );
};

export default InvoiceView;
