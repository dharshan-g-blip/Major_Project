import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axiosInstance';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getDoctorCardMeta } from '../../utils/doctorMeta';
import {
  User,
  ShieldCheck,
  Award,
  Globe,
  MapPin,
  Clock,
  Sparkles,
  IndianRupee,
  Link as LinkIcon,
  Save,
  ExternalLink,
  Phone,
  Image as ImageIcon,
  Zap,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    qualifications: '',
    bio: '',
    specializations: '',
    languages: '',
    sessionFee: 2500,
    bufferTime: 15,
    allowedDurations: '30, 45, 60, 90',
    experienceYears: 5,
    phone: '',
    clinicAddress: '',
    avatarUrl: '',
    desiredSlug: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const avatarPresets = [
    {
      id: 'avatar1',
      name: 'Clinical Headshot 1',
      url: 'https://images.unsplash.com/photo-1594824813639-444f9cfab03a?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'avatar2',
      name: 'Clinical Headshot 2',
      url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'avatar3',
      name: 'Clinical Headshot 3',
      url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'avatar4',
      name: 'Clinical Headshot 4',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    },
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        qualifications: user.qualifications || '',
        bio: user.bio || '',
        specializations: Array.isArray(user.specializations)
          ? user.specializations.join(', ')
          : user.specializations || '',
        languages: Array.isArray(user.languages)
          ? user.languages.join(', ')
          : user.languages || '',
        sessionFee: user.sessionFee || 2000,
        bufferTime: user.bufferTime || 15,
        allowedDurations: Array.isArray(user.allowedDurations)
          ? user.allowedDurations.join(', ')
          : '30, 45, 60, 90',
        experienceYears: user.experienceYears || 5,
        phone: user.phone || '',
        clinicAddress: user.clinicAddress || '',
        avatarUrl: user.avatarUrl || avatarPresets[0].url,
        desiredSlug: user.slug || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Demo Autofill for testing
  const autofillDemoProfile = () => {
    setFormData((prev) => ({
      ...prev,
      name: 'Dr. Ananya Sharma',
      qualifications: 'Ph.D. in Clinical Psychology (NIMHANS), RCI Reg. CRR-A49102',
      bio: 'Compassionate, evidence-based psychotherapy specialist with over 8 years of clinical experience in cognitive-behavioral and mindfulness-based interventions. Specialized in treating anxiety disorders, perfectionism, corporate burnout, and interpersonal relationship dynamics.',
      specializations: 'Cognitive Behavioral Therapy (CBT), Anxiety & Panic, Burnout, ACT, Depressive Disorders',
      languages: 'English, Hindi, Kannada',
      sessionFee: 2500,
      bufferTime: 15,
      allowedDurations: '30, 45, 60, 90',
      experienceYears: 8,
      phone: '+91 98765 43210',
      clinicAddress: 'Online Telehealth & Suite 402, Indiranagar, Bangalore, Karnataka',
      avatarUrl: avatarPresets[0].url,
      desiredSlug: 'dr-sharma',
    }));
    toast.info('Sample RCI Practice Profile auto-filled!');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const payload = {
        name: formData.name.trim(),
        qualifications: formData.qualifications.trim(),
        bio: formData.bio.trim(),
        specializations: formData.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: formData.languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        sessionFee: Number(formData.sessionFee) || 2000,
        bufferTime: Number(formData.bufferTime) || 15,
        allowedDurations: formData.allowedDurations
          .split(',')
          .map((d) => Number(d.trim()))
          .filter(Boolean),
        experienceYears: Number(formData.experienceYears) || 5,
        phone: formData.phone.trim(),
        clinicAddress: formData.clinicAddress.trim(),
        avatarUrl: formData.avatarUrl,
        desiredSlug: formData.desiredSlug.trim().toLowerCase(),
      };

      const res = await api.put('/therapist/profile', payload);
      if (res.data.success) {
        await refreshUser();
        setSaveSuccess(true);
        toast.success('Practice profile updated and published successfully!');
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>Practice Identity & Public Booking Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-teal-800" />
            <span>Doctor Practice Profile</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your statutory credentials, clinical bio, consultation fee, appointment buffer times, and branded booking URL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={autofillDemoProfile}
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-teal-700 fill-teal-700" />
            <span>⚡ Demo Autofill Profile</span>
          </button>

          <a
            href={`/${formData.desiredSlug || user?.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Preview Public Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </a>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile changes have been successfully saved and synced to your public booking link!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Inputs (2 columns) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
          {/* Section 1: Clinical Credentials */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-800" />
                <span>Practitioner Credentials & Identification</span>
              </h3>
              <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                RCI Ethical Guidelines
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. Ananya Sharma"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Branded URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2.5 border border-r-0 border-slate-200 rounded-l-xl font-mono">
                    serenova.care/
                  </span>
                  <input
                    type="text"
                    name="desiredSlug"
                    required
                    value={formData.desiredSlug}
                    onChange={handleChange}
                    placeholder="dr-sharma"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-mono font-bold text-teal-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Statutory Qualifications & RCI Registration *
              </label>
              <input
                type="text"
                name="qualifications"
                required
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="e.g. Ph.D. in Clinical Psychology (NIMHANS), RCI Reg. CRR-A78912"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Bio & Therapeutic Philosophy
              </label>
              <textarea
                rows={4}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Describe your therapeutic style, clinical orientations, empathy approach, and what prospective clients can expect in their initial session..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 leading-relaxed font-normal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specializations (Comma-separated)
                </label>
                <input
                  type="text"
                  name="specializations"
                  value={formData.specializations}
                  onChange={handleChange}
                  placeholder="CBT, Anxiety, Trauma, OCD, Burnout"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Languages Spoken
                </label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="English, Hindi, Kannada"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Monogram Branding */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-800" />
                <span>Clinical Monogram & Card Branding</span>
              </h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white flex flex-col items-center justify-center font-bold text-sm ring-2 ring-teal-700/20 shadow-xs select-none flex-shrink-0">
                <span className="text-xl font-black">{getDoctorCardMeta(formData.name).initials}</span>
                <span className="text-[9px] text-teal-200 font-medium">Doctor</span>
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Automated Vector Monogram Card
                </span>
                <span>
                  Your public profile displays an elegant clinical monogram card with your initials (
                  <strong>{getDoctorCardMeta(formData.name).initials}</strong>) and RCI verification badge.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Consultation Logistics & Fees */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-teal-800" />
                <span>Consultation Rates, Buffer & Duration Settings</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Session Fee (INR) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="sessionFee"
                    required
                    value={formData.sessionFee}
                    onChange={handleChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-bold text-teal-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Buffer Time (Minutes) *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="bufferTime"
                    required
                    value={formData.bufferTime}
                    onChange={handleChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Experience (Years) *
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="experienceYears"
                    required
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinic Consultation Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={handleChange}
                    placeholder="Indiranagar, Bangalore & Online"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Practice Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">All changes synchronize live to client booking slots</span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={saving}
              className="shadow-md"
            >
              Save Profile Changes
            </Button>
          </div>
        </form>

        {/* Live Profile Card Preview (1 column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-800" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Public Card Preview
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Auto Updates
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white flex flex-col items-center justify-center font-bold text-sm ring-2 ring-teal-700/20 shadow-xs select-none flex-shrink-0">
                <span className="text-base font-black">{getDoctorCardMeta(formData.name).initials}</span>
                <span className="text-[9px] text-teal-200 font-medium">Doctor</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {formData.name || 'Dr. Ananya Sharma'}
                </h3>
                <span className="text-[11px] text-teal-800 font-semibold block line-clamp-1">
                  {formData.qualifications || 'Licensed Clinical Psychologist'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>{formData.experienceYears}+ years clinical experience</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {formData.bio || 'Your clinical bio and approach will appear here...'}
            </p>

            {/* Specialization Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.specializations
                .split(',')
                .slice(0, 4)
                .map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/60"
                  >
                    {s.trim()}
                  </span>
                ))}
            </div>

            {/* Fee & Location summary */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Consultation Fee:</span>
                <span className="font-black text-teal-900 text-base">₹{formData.sessionFee}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Buffer Interval:</span>
                <span className="font-semibold text-slate-700">{formData.bufferTime} mins</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Languages:</span>
                <span className="font-semibold text-slate-700">{formData.languages || 'English'}</span>
              </div>
            </div>

            {/* Branded URL Pill */}
            <div className="p-3 bg-teal-50/70 rounded-2xl text-center text-xs font-mono text-teal-900 font-extrabold border border-teal-200/60 flex items-center justify-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>serenova.care/{formData.desiredSlug || 'dr-sharma'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
