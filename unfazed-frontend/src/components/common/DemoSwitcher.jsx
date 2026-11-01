import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Globe,
  Settings,
  Video,
  LogIn,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';

export const DemoSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, clientUser, sessionRole } = useAuth();

  // Role-Aware Navigation: ONLY show features relevant to the active logged-in persona
  const therapistLinks = [
    { label: 'Therapist Dashboard', to: '/therapist/dashboard', icon: LayoutDashboard },
    { label: 'Schedule & Calendar', to: '/therapist/schedule', icon: Calendar },
    { label: 'Client CRM Roster', to: '/therapist/clients', icon: Users },
    { label: 'Clinical Documentation', to: '/therapist/notes', icon: FileText },
    { label: 'Practice Analytics', to: '/therapist/analytics', icon: BarChart3 },
    { label: 'Profile Settings', to: '/therapist/profile', icon: Settings },
    { label: 'Public Branded Link', to: `/${user?.slug || 'dr-sharma'}`, icon: Globe },
  ];

  const clientLoggedInLinks = [
    { label: 'Client Sanctuary', to: '/portal', icon: UserCheck },
    { label: 'Book Another Session', to: '/dr-sharma', icon: Globe },
    { label: 'Platform Overview', to: '/overview', icon: Compass },
  ];

  const guestLinks = [
    { label: 'Platform Overview', to: '/overview', icon: Compass },
    { label: 'Sign In (Unified Portal)', to: '/login', icon: LogIn },
    { label: 'Register New Account', to: '/register', icon: UserCheck },
    { label: 'Dr. Sharma Booking Link', to: '/dr-sharma', icon: Globe },
  ];

  const activeLinks =
    sessionRole === 'doctor' && user
      ? therapistLinks
      : sessionRole === 'client' && clientUser
      ? clientLoggedInLinks
      : guestLinks;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-2.5 transition-all">
        <div className="flex items-center justify-between gap-3 px-2 py-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-teal-400'} animate-ping`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              {sessionRole === 'doctor'
                ? 'Doctor Navigator'
                : sessionRole === 'client'
                ? 'Client Navigator'
                : 'Serenova Navigator'}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse Navigator' : 'Expand Navigator'}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col gap-1 w-64 text-xs">
            {/* Persona Indicator */}
            <div className="px-2 py-1 mb-1 rounded-lg bg-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Persona:</span>
              <span className="font-semibold text-teal-300">
                {sessionRole === 'doctor' && user
                  ? `Dr. ${user.name || 'Sharma'} (Practitioner)`
                  : sessionRole === 'client' && clientUser
                  ? `${clientUser.name} (Client)`
                  : 'Visitor / Overview'}
              </span>
            </div>

            {activeLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to.split('?')[0];

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-teal-700 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoSwitcher;
