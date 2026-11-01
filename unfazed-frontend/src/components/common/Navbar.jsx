import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  ExternalLink,
  LogOut,
  Sparkles,
  Shield,
  Layers,
  ChevronDown,
  Settings,
  Stethoscope,
  User,
  HelpCircle,
  Menu,
  X,
  Zap,
} from 'lucide-react';

export const Navbar = () => {
  const { user, clientUser, sessionRole, entitlements, logout, logoutClient, upgradeTier } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tierMenuOpen, setTierMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const doctorNavItems = [
    { name: 'Dashboard', path: '/therapist/dashboard', icon: Layers },
    { name: 'Schedule', path: '/therapist/schedule', icon: Calendar },
    { name: 'Clients', path: '/therapist/clients', icon: Users },
    { name: 'Clinical Notes', path: '/therapist/notes', icon: FileText },
    { name: 'Analytics', path: '/therapist/analytics', icon: BarChart3 },
    { name: 'Profile', path: '/therapist/profile', icon: Settings },
  ];

  const clientNavItems = [
    { name: 'My Sanctuary', path: '/portal', icon: Shield },
    { name: 'Browse Doctors', path: '/overview#doctors', icon: Stethoscope },
  ];

  const handleTierSwitch = async (tier) => {
    try {
      await upgradeTier(tier);
      setTierMenuOpen(false);
    } catch (e) {
      alert('Failed to switch tier');
    }
  };

  const tierColors = {
    free: 'bg-slate-100 text-slate-700 border-slate-300',
    starter: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pro: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              to={sessionRole === 'doctor' ? '/therapist/dashboard' : sessionRole === 'client' ? '/portal' : '/overview'}
              className="flex items-center gap-2.5 group"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm transition-transform group-hover:scale-105 ${
                  sessionRole === 'client' ? 'bg-emerald-700' : 'bg-teal-800'
                }`}
              >
                Ψ
              </div>
              <div>
                <span className="font-black text-lg text-slate-900 tracking-tight">Serenova</span>
                <span className="text-[10px] text-teal-800 font-bold block -mt-1 uppercase tracking-wider">
                  {sessionRole === 'client' ? 'Client Sanctuary' : 'Practice Suite'}
                </span>
              </div>
            </Link>

            {/* DOCTOR EXCLUSIVE DESKTOP NAVIGATION */}
            {sessionRole === 'doctor' && user && (
              <nav className="hidden lg:flex items-center space-x-1">
                {doctorNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-900 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* CLIENT EXCLUSIVE DESKTOP NAVIGATION */}
            {sessionRole === 'client' && clientUser && (
              <nav className="hidden md:flex items-center space-x-1">
                {clientNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. DOCTOR LOGGED IN */}
            {sessionRole === 'doctor' && user ? (
              <>
                {/* Dynamic Subscription Tier Badge & Live Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setTierMenuOpen(!tierMenuOpen)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-xs transition-all ${
                      tierColors[user.subscriptionTier] || tierColors.starter
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-current" />
                    <span className="capitalize">{user.subscriptionTier} Plan</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>

                  {tierMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Live Tier Switcher
                      </div>
                      {['free', 'starter', 'pro'].map((t) => (
                        <button
                          key={t}
                          onClick={() => handleTierSwitch(t)}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                            user.subscriptionTier === t ? 'font-semibold text-teal-800 bg-teal-50/50' : 'text-slate-700'
                          }`}
                        >
                          <span className="capitalize">{t} Plan</span>
                          {user.subscriptionTier === t && <span className="text-[10px] text-teal-700">Active</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Branded Link Preview */}
                <a
                  href={`/${user.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition-colors border border-teal-200/60"
                  title="Open your public branded page that clients see"
                >
                  <span>serenova.care/{user.slug}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Doctor Identity Pill */}
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-950 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-xl">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-800" />
                  <span className="hidden sm:inline">{user.name}</span>
                  <span className="sm:hidden">Doctor</span>
                </span>

                {/* Logout Doctor */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login/doctor');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  title="Logout Doctor Workspace"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Menu Toggle for Doctor */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-xl"
                  title="Toggle Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : sessionRole === 'client' && clientUser ? (
              /* 2. CLIENT LOGGED IN */
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{clientUser.name}</span>
                  </span>

                  <button
                    onClick={() => {
                      logoutClient();
                      navigate('/login/client');
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Sign Out of Client Sanctuary"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>

                  {/* Mobile Menu Toggle for Client */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-xl"
                    title="Toggle Menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              /* 3. GUEST / UNLOGGED - MODERN UNIFIED PLATFORM NAVIGATION */
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="/overview#doctors"
                  className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100/70 transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-800" />
                  <span>Browse Doctors</span>
                </a>

                <a
                  href="/overview#therapy-process"
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100/70 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>How Therapy Works</span>
                </a>

                {/* Subtle For Doctors Link */}
                <Link
                  to="/login?role=doctor"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-teal-900 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/80 px-2.5 py-1.5 rounded-xl transition-colors"
                  title="Practitioner Workspace Sign In"
                >
                  <span>For Doctors</span>
                </Link>

                {/* Unified Sign In Button (PDF-Compliant) */}
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-teal-900 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </Link>

                {/* Get Started / Registration */}
                <Link
                  to="/register"
                  className="inline-flex items-center text-xs font-extrabold bg-teal-800 text-white hover:bg-teal-900 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                >
                  Get Started
                </Link>

                {/* Mobile Menu Toggle for Guests */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 text-slate-600 md:hidden hover:bg-slate-100 rounded-xl"
                  title="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 px-2 space-y-1 bg-white animate-fade-in">
            {sessionRole === 'doctor' &&
              doctorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl ${
                      isActive ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-700" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

            {sessionRole === 'client' &&
              clientNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl ${
                      isActive ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-700" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

            {!sessionRole && (
              <div className="space-y-1.5 pt-1">
                <a
                  href="/overview#doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span>Browse Doctors</span>
                </a>
                <a
                  href="/overview#therapy-process"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>How Therapy Works</span>
                </a>
                <Link
                  to="/login?role=doctor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-teal-900 bg-teal-50 rounded-xl"
                >
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span>For Doctors / Practitioners</span>
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-bold text-white bg-teal-800 rounded-xl"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
