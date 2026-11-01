import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Heart, Stethoscope, User, Lock, FileCheck, Award, Sparkles } from 'lucide-react';

export const Footer = () => {
  const { sessionRole, user, clientUser } = useAuth();

  // -------------------------------------------------------------
  // 1. PATIENT / CLIENT LOGGED IN FOOTER
  // -------------------------------------------------------------
  if (sessionRole === 'client' && clientUser) {
    return (
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                Ψ
              </div>
              <div>
                <span className="font-black text-slate-900 text-sm tracking-tight">Serenova Sanctuary</span>
                <span className="text-[11px] text-emerald-800 block -mt-0.5 font-medium">
                  Your confidential portal for therapy appointments, homework, and private communication
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
              <Link to="/portal" className="text-slate-600 hover:text-emerald-800 transition-colors">
                My Sanctuary
              </Link>
              <span>•</span>
              <a href="/overview#doctors" className="text-slate-600 hover:text-emerald-800 transition-colors">
                Find a Doctor
              </a>
              <span>•</span>
              <a href="/overview#coupons" className="text-slate-600 hover:text-emerald-800 transition-colors">
                Care Discounts
              </a>
              <span>•</span>
              <Link to="/overview" className="text-slate-600 hover:text-emerald-800 transition-colors">
                About Therapy
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>
              © {new Date().getFullYear()} <strong>Serenova Sanctuary</strong>. Dedicated to your personal mental wellness.
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Confidential Care
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Digital Informed Consent
              </span>
              <span>•</span>
              <span>Official SAC 999312 Medical Receipts</span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // -------------------------------------------------------------
  // 2. DOCTOR / PRACTITIONER LOGGED IN FOOTER
  // -------------------------------------------------------------
  if (sessionRole === 'doctor' && user) {
    return (
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-800 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                Ψ
              </div>
              <div>
                <span className="font-black text-slate-900 text-sm tracking-tight">Serenova Practice Suite</span>
                <span className="text-[11px] text-teal-800 block -mt-0.5 font-medium">
                  Clinical management and telehealth workspace for licensed practitioners
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
              <Link to="/therapist/dashboard" className="text-slate-600 hover:text-teal-900 transition-colors">
                Dashboard
              </Link>
              <span>•</span>
              <Link to="/therapist/schedule" className="text-slate-600 hover:text-teal-900 transition-colors">
                Schedule
              </Link>
              <span>•</span>
              <Link to="/therapist/clients" className="text-slate-600 hover:text-teal-900 transition-colors">
                Clients
              </Link>
              <span>•</span>
              <Link to="/therapist/notes" className="text-slate-600 hover:text-teal-900 transition-colors">
                Clinical Notes
              </Link>
              <span>•</span>
              <Link to={`/${user.slug}`} className="text-teal-800 hover:underline">
                View Public Profile
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>
              © {new Date().getFullYear()} <strong>Serenova Practice Suite</strong>. Licensed practitioner operations.
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" /> RCI Ethical Compliance
              </span>
              <span>•</span>
              <span>SAC 999312 GST Invoicing</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Encrypted Clinical Vault
              </span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // -------------------------------------------------------------
  // 3. PUBLIC GUEST / OVERVIEW VISITOR FOOTER
  // -------------------------------------------------------------
  return (
    <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
              Ψ
            </div>
            <div>
              <span className="font-black text-slate-900 text-sm tracking-tight">Serenova</span>
              <span className="text-[11px] text-teal-800 block -mt-0.5 font-medium">
                High-quality mental healthcare, tailored to you
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <a href="/overview#therapy-process" className="text-slate-600 hover:text-teal-900 transition-colors">
              About Therapy
            </a>
            <span>•</span>
            <a href="/overview#doctors" className="text-slate-600 hover:text-teal-900 transition-colors">
              Browse Doctors
            </a>
            <span>•</span>
            <a href="/overview#coupons" className="text-emerald-700 hover:underline">
              Healing Discounts
            </a>
            <span>•</span>
            <Link to="/login/client" className="text-emerald-700 hover:underline">
              Client Sign In
            </Link>
            <span>•</span>
            <Link to="/login/doctor" className="text-teal-800 hover:underline">
              Doctor Sign In
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>
            © {new Date().getFullYear()} <strong>Serenova</strong>. All rights reserved.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" /> RCI Licensed Clinicians
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-teal-700" /> Strict Patient Confidentiality
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-teal-700" /> SAC 999312 GST Healthcare Receipts
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
