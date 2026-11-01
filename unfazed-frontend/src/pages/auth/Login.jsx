import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Stethoscope,
  User,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Zap,
  KeyRound,
  ChevronDown,
} from 'lucide-react';
import Button from '../../components/common/Button';

export const Login = ({ forcedRole }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole =
    forcedRole || (searchParams.get('role') === 'doctor' ? 'doctor' : 'client');
  const [role, setRole] = useState(initialRole);

  // Form State
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientEmail, setClientEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, loginClient } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (forcedRole) {
      setRole(forcedRole);
    } else {
      const r = searchParams.get('role');
      if (r === 'client' || r === 'doctor') {
        setRole(r);
      }
    }
  }, [forcedRole, searchParams]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (!forcedRole) {
      setSearchParams({ role: newRole });
    } else {
      navigate(`/login/${newRole}`);
    }
    setErrorMsg('');
  };

  // DOCTOR SIGN IN HANDLER
  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await login(doctorEmail, doctorPassword);
      toast.success('Successfully logged into Practitioner Workspace!');
      navigate('/therapist/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
      toast.error(err.message || 'Doctor login failed');
    } finally {
      setLoading(false);
    }
  };

  // CLIENT SIGN IN HANDLER
  const handleClientLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginClient(clientEmail);
      toast.success('Welcome to your Client Sanctuary!');
      navigate('/portal');
    } catch (err) {
      setErrorMsg(err.message || 'No client record found for this email');
      toast.error(err.message || 'Client sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Doctor Demo Presets
  const fillDoctor = (email, name) => {
    setDoctorEmail(email);
    setDoctorPassword('Password123!');
    toast.info(`${name} demo credentials loaded.`);
  };

  // Client Demo Presets
  const fillClient = (email, name) => {
    setClientEmail(email);
    toast.info(`${name} demo email loaded.`);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl relative overflow-hidden">
        {/* Decorative corner accent */}
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-20 ${
            role === 'doctor' ? 'bg-teal-600' : 'bg-emerald-600'
          }`}
        />

        {/* Top Branding & Context */}
        <div className="text-center relative">
          <div
            className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto shadow-md transition-colors ${
              role === 'doctor' ? 'bg-teal-800' : 'bg-emerald-700'
            }`}
          >
            {role === 'doctor' ? <Stethoscope className="w-7 h-7" /> : <User className="w-7 h-7" />}
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            {role === 'doctor' ? 'Doctor / Practitioner Sign In' : 'Client / Patient Sanctuary Sign In'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
            {role === 'doctor'
              ? 'Secure RCI-compliant clinical management & EHR workspace'
              : 'Private sanctuary for your therapy sessions, homework & chat'}
          </p>
        </div>

        {/* Role Selector Tabs (Only shown on generic /login, hidden on dedicated /login/doctor or /login/client) */}
        {!forcedRole && (
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1 border border-slate-200/70">
            <button
              type="button"
              onClick={() => handleRoleChange('client')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'client'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Client Sanctuary</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('doctor')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'doctor'
                  ? 'bg-teal-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Workspace</span>
            </button>
          </div>
        )}

        {/* Error Message Display */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* ----------------- DOCTOR LOGIN TAB ----------------- */}
        {role === 'doctor' && (
          <div className="space-y-4">
            <form className="space-y-4" onSubmit={handleDoctorLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Practitioner Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="dr.sharma@serenova.care"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-md text-xs sm:text-sm mt-2"
              >
                Sign In to Doctor Workspace →
              </Button>
            </form>

            {/* 1-Click Demo Doctor Accounts */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold text-teal-900 block">
                ⚡ 1-Click Demo Doctor Accounts:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDoctor('dr.sharma@serenova.care', 'Dr. Sharma')}
                  className="text-[11px] font-bold text-teal-900 bg-teal-50 hover:bg-teal-100/80 py-1.5 px-2 rounded-xl border border-teal-200 text-center transition-colors"
                  title="Dr. Ananya Sharma (CBT Specialist)"
                >
                  Dr. Sharma
                </button>
                <button
                  type="button"
                  onClick={() => fillDoctor('dr.menon@serenova.care', 'Dr. Menon')}
                  className="text-[11px] font-bold text-teal-900 bg-teal-50 hover:bg-teal-100/80 py-1.5 px-2 rounded-xl border border-teal-200 text-center transition-colors"
                  title="Dr. Rajesh Menon (ACT & ADHD)"
                >
                  Dr. Menon
                </button>
                <button
                  type="button"
                  onClick={() => fillDoctor('dr.nair@serenova.care', 'Dr. Nair')}
                  className="text-[11px] font-bold text-teal-900 bg-teal-50 hover:bg-teal-100/80 py-1.5 px-2 rounded-xl border border-teal-200 text-center transition-colors"
                  title="Dr. Priya Nair (Couples & EFT)"
                >
                  Dr. Nair
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>New therapist?</span>
              <Link
                to="/register/doctor"
                className="font-bold text-teal-800 hover:text-teal-900"
              >
                Register Practice Suite
              </Link>
            </div>
          </div>
        )}

        {/* ----------------- CLIENT LOGIN TAB ----------------- */}
        {role === 'client' && (
          <div className="space-y-4">
            <form className="space-y-4" onSubmit={handleClientLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Client Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="rohan.verma@example.com"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 font-medium transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the email address registered with your practitioner.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Entering Sanctuary...' : 'Sign In to Client Sanctuary →'}
              </button>
            </form>

            {/* 1-Click Demo Client Accounts Grouped by Doctor */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[10px]">
              <span className="text-[11px] font-bold text-emerald-950 block">
                ⚡ 1-Click Demo Client Accounts:
              </span>
              <div>
                <span className="font-semibold text-slate-500 block mb-1">Dr. Sharma's Patients:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillClient('rohan.verma@example.com', 'Rohan Verma')}
                    className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 py-1.5 px-2 rounded-xl border border-emerald-200 text-center transition-colors"
                  >
                    Rohan Verma
                  </button>
                  <button
                    type="button"
                    onClick={() => fillClient('pooja.iyer@example.com', 'Pooja Iyer')}
                    className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 py-1.5 px-2 rounded-xl border border-emerald-200 text-center transition-colors"
                  >
                    Pooja Iyer
                  </button>
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block mb-1">Dr. Menon's Patients:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillClient('vikram.rao@example.com', 'Vikramaditya Rao')}
                    className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 py-1.5 px-2 rounded-xl border border-emerald-200 text-center transition-colors"
                  >
                    Vikramaditya
                  </button>
                  <button
                    type="button"
                    onClick={() => fillClient('sneha.kapoor@example.com', 'Sneha Kapoor')}
                    className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 py-1.5 px-2 rounded-xl border border-emerald-200 text-center transition-colors"
                  >
                    Sneha Kapoor
                  </button>
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block mb-1">Dr. Nair's Patients:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillClient('aarav.malhotra@example.com', 'Aarav Malhotra')}
                    className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 py-1.5 px-2 rounded-xl border border-emerald-200 text-center transition-colors"
                  >
                    Aarav Malhotra
                  </button>
                  <button
                    type="button"
                    onClick={() => fillClient('meera.sen@example.com', 'Meera Sen')}
                    className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 py-1.5 px-2 rounded-xl border border-emerald-200 text-center transition-colors"
                  >
                    Meera Sen
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>New patient?</span>
              <Link
                to="/register/client"
                className="font-bold text-emerald-700 hover:text-emerald-800"
              >
                Register Client Account
              </Link>
            </div>
          </div>
        )}

        {/* Global Link Back to Detailed Overview */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            to="/overview"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-800 transition-colors font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need help choosing? View Platform Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
