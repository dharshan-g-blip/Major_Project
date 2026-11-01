import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Lock,
  Mail,
  User,
  Award,
  IndianRupee,
  Phone,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import Button from '../../components/common/Button';

export const Register = ({ forcedRole }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole =
    forcedRole || (searchParams.get('role') === 'client' ? 'client' : 'doctor');
  const [role, setRole] = useState(initialRole);

  // Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    qualifications: 'Licensed Clinical Psychologist (RCI)',
    specializations: 'Anxiety, Depression, CBT',
    languages: 'English, Hindi',
    sessionFee: 2000,
  });
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  // Client Form State
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    consentAgreed: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, registerClient } = useAuth();
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
      navigate(`/register/${newRole}`);
    }
    setErrorMsg('');
  };

  const handleDoctorChange = (e) => {
    setDoctorForm({ ...doctorForm, [e.target.name]: e.target.value });
  };

  const handleClientChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClientForm({ ...clientForm, [name]: type === 'checkbox' ? checked : value });
  };

  // Demo Autofill for Doctor Registration
  const autofillDoctorDemo = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setDoctorForm({
      name: `Dr. Radhika Sen`,
      email: `dr.radhika${randomSuffix}@serenova.care`,
      password: 'Password123!',
      qualifications: 'M.Phil Clinical Psychology (NIMHANS), RCI Reg. CRR-B78942',
      specializations: 'Cognitive Behavioral Therapy (CBT), Anxiety, Trauma, ACT',
      languages: 'English, Hindi, Bengali',
      sessionFee: 2200,
    });
    toast.info('Sample doctor registration details auto-filled!');
  };

  // Demo Autofill for Client Registration
  const autofillClientDemo = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setClientForm({
      name: 'Aarav Malhotra',
      email: `aarav.malhotra${randomSuffix}@example.com`,
      phone: '+91 98765 43210',
      consentAgreed: true,
    });
    toast.info('Sample client registration details auto-filled!');
  };

  // Doctor Register Submit
  const handleDoctorRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        name: doctorForm.name.trim(),
        email: doctorForm.email.toLowerCase().trim(),
        password: doctorForm.password,
        qualifications: doctorForm.qualifications.trim(),
        specializations: doctorForm.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        languages: doctorForm.languages.split(',').map((l) => l.trim()).filter(Boolean),
        sessionFee: Number(doctorForm.sessionFee) || 2000,
      };

      await register(payload);
      toast.success('Your practice suite has been created successfully!');
      navigate('/therapist/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Practitioner registration failed');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Client Register Submit
  const handleClientRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientForm.consentAgreed) {
      setErrorMsg('Please agree to practice confidentiality and telehealth guidelines');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: clientForm.name.trim(),
        email: clientForm.email.toLowerCase().trim(),
        phone: clientForm.phone.trim(),
        therapistSlug: 'dr-sharma',
      };

      await registerClient(payload);
      toast.success('Client profile created! Welcome to your Sanctuary.');
      navigate('/portal');
    } catch (err) {
      setErrorMsg(err.message || 'Client registration failed');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50">
      <div className="max-w-lg w-full space-y-6 bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl relative overflow-hidden">
        {/* Accent background dot */}
        <div
          className={`absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none opacity-20 ${
            role === 'doctor' ? 'bg-teal-700' : 'bg-emerald-700'
          }`}
        />

        {/* Top Header */}
        <div className="text-center relative">
          <div
            className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto shadow-md ${
              role === 'doctor' ? 'bg-teal-800' : 'bg-emerald-700'
            }`}
          >
            {role === 'doctor' ? <Stethoscope className="w-7 h-7" /> : <User className="w-7 h-7" />}
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            {role === 'doctor' ? 'Register New Practice Suite' : 'Register as Therapy Client'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {role === 'doctor'
              ? 'Launch your independent mental health practice in India'
              : 'Create your private client profile for confidential therapy'}
          </p>
        </div>

        {/* Role Switcher Tabs (Only shown on generic /register, hidden on dedicated /register/doctor or /register/client) */}
        {!forcedRole && (
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1 border border-slate-200/70">
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
              <span>Doctor / Practice</span>
            </button>
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
              <span>Client / Patient</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* DOCTOR REGISTRATION FORM */}
        {role === 'doctor' && (
          <form className="space-y-4" onSubmit={handleDoctorRegister}>
            {/* Fast Demo Autofill Button */}
            <div className="bg-teal-50 border border-teal-200/80 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-teal-950 font-semibold">
                <Zap className="w-4 h-4 text-teal-700 fill-teal-700" />
                <span>Instant Testing:</span>
              </div>
              <button
                type="button"
                onClick={autofillDoctorDemo}
                className="text-xs font-bold text-teal-900 hover:text-teal-950 bg-white hover:bg-teal-100/50 px-3 py-1 rounded-xl border border-teal-200 shadow-xs transition-colors"
              >
                ⚡ Autofill Sample RCI Practice
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Practitioner Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={doctorForm.name}
                    onChange={handleDoctorChange}
                    placeholder="Dr. Radhika Sen"
                    className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={doctorForm.email}
                    onChange={handleDoctorChange}
                    placeholder="dr.sen@serenova.care"
                    className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showDoctorPassword ? 'text' : 'password'}
                  required
                  name="password"
                  value={doctorForm.password}
                  onChange={handleDoctorChange}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showDoctorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Qualifications & Registration (RCI) *
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  name="qualifications"
                  value={doctorForm.qualifications}
                  onChange={handleDoctorChange}
                  placeholder="M.Phil in Clinical Psychology (NIMHANS), RCI Reg. CRR-B78942"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specializations
                </label>
                <input
                  type="text"
                  name="specializations"
                  value={doctorForm.specializations}
                  onChange={handleDoctorChange}
                  placeholder="Anxiety, CBT, Depression"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Standard Session Fee (INR)
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="sessionFee"
                    value={doctorForm.sessionFee}
                    onChange={handleDoctorChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-bold"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full shadow-md text-xs sm:text-sm mt-3"
            >
              Create Practice & Launch Dashboard →
            </Button>

            <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Already registered? </span>
              <Link to="/login/doctor" className="font-bold text-teal-800 hover:text-teal-900">
                Sign in to Doctor Workspace
              </Link>
            </div>
          </form>
        )}

        {/* CLIENT REGISTRATION FORM */}
        {role === 'client' && (
          <form className="space-y-4" onSubmit={handleClientRegister}>
            {/* Fast Demo Autofill Button for Client */}
            <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-950 font-semibold">
                <Zap className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                <span>Instant Testing:</span>
              </div>
              <button
                type="button"
                onClick={autofillClientDemo}
                className="text-xs font-bold text-emerald-900 hover:text-emerald-950 bg-white hover:bg-emerald-100/50 px-3 py-1 rounded-xl border border-emerald-200 shadow-xs transition-colors"
              >
                ⚡ Autofill Sample Client
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  name="name"
                  value={clientForm.name}
                  onChange={handleClientChange}
                  placeholder="Aarav Malhotra"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  name="email"
                  value={clientForm.email}
                  onChange={handleClientChange}
                  placeholder="aarav.malhotra@example.com"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (WhatsApp for reminders)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  value={clientForm.phone}
                  onChange={handleClientChange}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consentAgreed"
                name="consentAgreed"
                checked={clientForm.consentAgreed}
                onChange={handleClientChange}
                className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <label htmlFor="consentAgreed" className="text-[11px] text-slate-600 leading-snug">
                I agree to the practice confidentiality, informed consent, and virtual telehealth guidelines.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-3"
            >
              {loading ? 'Registering...' : 'Register as Client & Enter Sanctuary →'}
            </button>

            <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Already registered as a client? </span>
              <Link to="/login/client" className="font-bold text-emerald-800 hover:text-emerald-900">
                Sign in to Client Sanctuary
              </Link>
            </div>
          </form>
        )}

        {/* Global Overview Link */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            to="/overview"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-800 transition-colors font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Return to Platform Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
