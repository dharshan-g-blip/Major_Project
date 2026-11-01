import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Clock,
  HeartHandshake,
  FileCheck,
  Activity,
  PhoneCall,
  Video,
  Tag,
  Copy,
  Check,
  Compass,
  ArrowRight,
  Brain,
  Layers,
  Heart,
  HelpCircle,
  Stethoscope,
  User,
} from 'lucide-react';

import { getDoctorCardMeta } from '../../utils/doctorMeta';

// Doctor Monogram Card (Like Ananya's Card for all doctors according to their name)
const DoctorCardImage = ({ doc }) => {
  const meta = getDoctorCardMeta(doc.name);

  return (
    <div className="relative h-56 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 overflow-hidden flex items-center justify-center p-6 select-none group">
      {/* Decorative ambient subtle circle glow */}
      <div className="absolute w-44 h-44 rounded-full bg-teal-600/10 blur-xl pointer-events-none" />

      {/* Styled Doctor Monogram Box (Identical to Ananya's Avatar Card) */}
      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 flex flex-col items-center justify-center ring-4 ring-white/20 shadow-xl text-white text-center p-3 transform transition-transform duration-300 group-hover:scale-105">
        <span className="text-3xl font-black tracking-wider text-white drop-shadow-sm">
          {meta.initials}
        </span>
        <span className="text-xs font-bold text-teal-100 mt-1 max-w-[110px] truncate">
          {meta.shortName}
        </span>
        <span className="text-[9px] uppercase tracking-widest text-teal-300 font-semibold mt-0.5">
          {meta.subtitle}
        </span>
      </div>

      {/* Floating Badges */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-bold text-teal-900 flex items-center gap-1.5 shadow-xs border border-teal-200/80">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
        <span>RCI Verified</span>
      </div>
      <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-xs">
        {doc.experienceYears}+ Yrs Experience
      </div>
    </div>
  );
};

export const AuthOverview = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('All');

  // Fallback data in case backend is initializing
  const fallbackTherapists = [
    {
      _id: 'dr_sharma_static',
      name: 'Dr. Ananya Sharma',
      slug: 'dr-sharma',
      qualifications: 'Ph.D. in Clinical Psychology (NIMHANS), RCI Reg. CRR-A78912',
      specializations: ['Anxiety & Panic', 'CBT', 'Workplace Burnout', 'Trauma Recovery'],
      languages: ['English', 'Hindi', 'Bengali'],
      experienceYears: 8,
      sessionFee: 2500,
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      clinicAddress: 'Bangalore & Online Telehealth',
      bio: 'Compassionate, evidence-based psychotherapy helping individuals unpack anxiety, relationship patterns, and chronic workplace burnout. Grounded in Cognitive Behavioral Therapy (CBT) and Mindfulness practices.',
    },
    {
      _id: 'dr_menon_static',
      name: 'Dr. Rajesh Menon',
      slug: 'dr-menon',
      qualifications: 'M.Phil in Clinical Psychology (AIIMS Delhi), RCI Reg. CRR-B45219',
      specializations: ['Depression & Mood Disorders', 'ACT', "Men's Mental Health", 'ADHD & Focus'],
      languages: ['English', 'Malayalam', 'Hindi', 'Tamil'],
      experienceYears: 11,
      sessionFee: 2200,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      clinicAddress: 'Kochi & Online Telehealth',
      bio: 'Senior clinical psychologist specializing in Acceptance & Commitment Therapy (ACT) and adult neurodivergence. Helping clients build psychological flexibility and cultivate life purpose.',
    },
    {
      _id: 'dr_nair_static',
      name: 'Dr. Priya Nair',
      slug: 'dr-nair',
      qualifications: 'Psy.D. in Clinical Psychology, RCI Reg. CRR-C99321',
      specializations: ['Couples Counseling', 'Family Therapy', 'Emotion-Focused Therapy (EFT)', 'Attachment Styles'],
      languages: ['English', 'Hindi', 'Marathi'],
      experienceYears: 9,
      sessionFee: 2800,
      avatarUrl: 'https://images.unsplash.com/photo-1594824813639-444f9cfab03a?auto=format&fit=crop&q=80&w=400',
      clinicAddress: 'Mumbai & Online Telehealth',
      bio: 'Specialist in systemic family dynamics, relational attunement, and couples therapy using Emotion-Focused Therapy (EFT). Dedicated to creating emotionally safe containers for couples.',
    },
  ];

  // Fetch doctors from backend
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoadingTherapists(true);
        const res = await api.get('/therapist/all');
        if (res.data?.therapists && res.data.therapists.length > 0) {
          setTherapists(res.data.therapists);
        } else {
          setTherapists(fallbackTherapists);
        }
      } catch (err) {
        setTherapists(fallbackTherapists);
      } finally {
        setLoadingTherapists(false);
      }
    };
    fetchTherapists();
  }, []);

  const copyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const specialtiesList = ['All', 'Anxiety & Panic', 'CBT', 'Depression', 'ACT', 'ADHD & Focus', 'Couples Counseling'];

  const displayedTherapists = therapists.filter((t) => {
    if (selectedSpecialtyFilter === 'All') return true;
    return (
      t.specializations?.some((s) => s.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase())) ||
      t.bio?.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase())
    );
  });

  const faqs = [
    {
      q: 'How does psychotherapy work on Serenova?',
      a: 'Serenova connects you directly with verified, RCI-licensed clinical psychologists and psychotherapists. You choose your doctor, book a convenient 50-minute virtual slot, and join an encrypted in-browser telehealth session with zero app installations. Your doctor provides personalized clinical care, followed by shared homework worksheets and direct chat check-ins in your private Sanctuary.',
    },
    {
      q: 'Where do I sign in or create my account?',
      a: 'All authentication controls are located exclusively at the top of the page in the navigation bar. If you are a client or patient, click "Client Login" or "Register". If you are a licensed therapist or doctor, click "Doctor Login".',
    },
    {
      q: 'How do I use the discount coupons (e.g. WELCOME10, HEAL15)?',
      a: 'During Step 3 (Payment) of booking any doctor, simply enter your promo code in the "Have a Promo Coupon?" box and click Apply. The discount will instantly be deducted from your session fee before payment confirmation.',
    },
    {
      q: 'Are my clinical records, session notes, and chats kept strictly confidential?',
      a: 'Yes, absolutely. Serenova enforces role-restricted clinical separation. Your doctor’s private diagnostic notes (SOAP/DAP) are isolated in a secure clinical vault and can never be viewed by clients, employers, or third parties. All communications strictly comply with RCI ethical standards and the Mental Healthcare Act 2017.',
    },
    {
      q: 'Can I claim health insurance reimbursement for my sessions?',
      a: 'Yes. Upon session completion and payment, Serenova automatically issues an official GST Tax Invoice containing SAC code 999312 (Specialised Healthcare/Psychotherapy Services) along with your doctor’s RCI registration number, which is valid for insurance reimbursement and official medical records.',
    },
    {
      q: 'What is the difference between CBT, ACT, and Emotion-Focused Therapy?',
      a: 'CBT (Cognitive Behavioral Therapy) focuses on identifying cognitive distortions and restructuring negative automatic thought loops. ACT (Acceptance & Commitment Therapy) cultivates psychological flexibility and defusion from anxiety. EFT (Emotion-Focused Therapy) targets emotional attunement and healing attachment wounds in individuals and couples.',
    },
  ];

  return (
    <div className="bg-[#FAF9F5] text-slate-800 min-h-screen">
      {/* 1. HERO SECTION (Alma / helloalma.com Warm Human Aesthetic) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-stone-200/60 bg-gradient-to-b from-[#F7F4EC] to-[#FAF9F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-900/5 border border-teal-900/10 text-teal-900 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-teal-800" />
              <span>Verified RCI-Licensed Mental Healthcare Across India</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Therapy that meets you where you are.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              High-quality mental healthcare, tailored to you. Connect with licensed clinical psychologists and psychotherapists for evidence-based individual, couples, and family therapy.
            </p>

            {/* Quick Navigation Anchor to Doctors */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#doctors"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-md transition-all hover:shadow-lg"
              >
                <span>Browse Licensed Doctors</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#therapy-process"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-100 text-slate-700 font-bold text-sm border border-stone-200 shadow-xs transition-all"
              >
                <span>How Therapy Works</span>
              </a>
              <a
                href="#coupons"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-200/80 shadow-xs transition-all"
              >
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>View Discount Coupons</span>
              </a>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-stone-200/80 mt-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-900 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">RCI Certified</span>
                  <span className="text-[11px] text-slate-500">Licensed Clinicians</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-900 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">100% Confidential</span>
                  <span className="text-[11px] text-slate-500">Zero Notes Leakage</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-900 flex items-center justify-center flex-shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Encrypted Video</span>
                  <span className="text-[11px] text-slate-500">Direct In-Browser</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-900 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Insurance Ready</span>
                  <span className="text-[11px] text-slate-500">SAC 999312 GST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DETAILS ABOUT THERAPY & THE THERAPEUTIC PROCESS */}
      <section id="therapy-process" className="scroll-mt-24 py-16 sm:py-24 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Understanding the Therapeutic Process
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Psychotherapy is not simply advice or conversation. It is a scientific, collaborative clinical container where you and your doctor work together to dismantle emotional suffering and build sustainable psychological vitality.
            </p>
          </div>

          {/* 4 Step Sequential Process */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-stone-200/90 relative space-y-3">
              <span className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-base text-slate-900">Find Your Clinical Match</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse our verified doctors by specialty, therapy framework (CBT, ACT, EFT), and language to choose the practitioner best suited to your life circumstances.
              </p>
            </div>

            <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-stone-200/90 relative space-y-3">
              <span className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base text-slate-900">Digital Intake & Consent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete a brief, confidential intake questionnaire detailing your presenting concerns and therapy goals, safeguarded by digital informed consent.
              </p>
            </div>

            <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-stone-200/90 relative space-y-3">
              <span className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base text-slate-900">50-Minute Virtual Sessions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meet your therapist in a private, encrypted in-browser video room. Explore cognitive schemas, process emotional blocks, and formulate practical strategies.
              </p>
            </div>

            <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-stone-200/90 relative space-y-3">
              <span className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold text-base text-slate-900">Continuous Growth & Worksheets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Access assigned reflection worksheets, breathing tools, thought diaries, and secure text messaging check-ins inside your dedicated Client Sanctuary.
              </p>
            </div>
          </div>

          {/* Evidence-Based Modalities Grid */}
          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200 space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <h3 className="text-lg font-bold text-slate-900">Evidence-Based Clinical Frameworks We Practice</h3>
              <p className="text-xs text-slate-500 mt-1">
                Our practitioners specialize in scientifically validated therapies proven to create meaningful neurobehavioral changes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-teal-800" />
                  <h4 className="font-bold text-xs text-slate-900">Cognitive Behavioral (CBT)</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Identifies automatic cognitive distortions and replaces catastrophic panic loops with rational, grounded thought experiments.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-bold text-xs text-slate-900">Acceptance & Commitment (ACT)</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Teaches cognitive defusion and mindfulness so you can accept difficult emotional sensations while taking values-committed action.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-800" />
                  <h4 className="font-bold text-xs text-slate-900">Emotion-Focused (EFT)</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Deepens emotional attunement, resolves core attachment insecurities, and restores communicative trust between couples and families.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-800" />
                  <h4 className="font-bold text-xs text-slate-900">Somatic & Mindfulness (MBSR)</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Regulates the autonomic nervous system using physiological sighs, vagus nerve stimulation, and sensory grounding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE DISCOUNT COUPONS & MULTI-SESSION PACKAGES */}
      <section id="coupons" className="scroll-mt-24 py-16 sm:py-20 bg-[#FAF9F5] border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Transparent & Accessible Care</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Healing Discounts & Session Bundles
            </h2>
            <p className="text-sm text-slate-600">
              High-quality mental healthcare should be accessible. Copy any active promo coupon below and apply it during appointment checkout to receive your discount.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coupon 1: WELCOME10 */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    First Session
                  </span>
                  <span className="text-xl font-black text-emerald-700">10% OFF</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">New Client Welcome</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Valid on your initial consultation with any verified doctor across anxiety, grief, couples, or general mental health.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  WELCOME10
                </span>
                <button
                  type="button"
                  onClick={() => copyCoupon('WELCOME10')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                >
                  {copiedCode === 'WELCOME10' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Coupon 2: HEAL15 */}
            <div className="bg-white p-6 rounded-3xl border border-teal-200 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    Ongoing Healing
                  </span>
                  <span className="text-xl font-black text-teal-700">15% OFF</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Continuous Mental Care</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For clients continuing their active psychotherapy journey and booking follow-up sessions and cognitive evaluations.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  HEAL15
                </span>
                <button
                  type="button"
                  onClick={() => copyCoupon('HEAL15')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white transition-colors"
                >
                  {copiedCode === 'HEAL15' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Coupon 3: STUDENT20 */}
            <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Student Wellness
                  </span>
                  <span className="text-xl font-black text-purple-700">20% OFF</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Student Assistance</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Specialized concession for university and college students coping with academic pressure, panic, or career uncertainty.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  STUDENT20
                </span>
                <button
                  type="button"
                  onClick={() => copyCoupon('STUDENT20')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white transition-colors"
                >
                  {copiedCode === 'STUDENT20' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-center text-xs text-teal-950 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>
              <strong>Multi-Session Care Bundles:</strong> You can also book 3-session or 6-session packages directly on each doctor's booking page with built-in 10% to 15% bundled savings.
            </span>
          </div>
        </div>
      </section>

      {/* 4. MEET OUR LICENSED DOCTORS (3 Doctors Showcase) */}
      <section id="doctors" className="scroll-mt-24 py-16 sm:py-24 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Meet Our Licensed Psychologists
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              All doctors on Serenova hold postgraduate or doctoral clinical degrees, RCI registrations, and verified clinical competence.
            </p>

            {/* Specialty Filter Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {specialtiesList.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialtyFilter(spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedSpecialtyFilter === spec
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-stone-100 text-slate-600 hover:bg-stone-200/80'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayedTherapists.map((doc) => (
              <div
                key={doc._id}
                className="bg-[#FAF9F5] rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Verified Badge using fail-safe DoctorCardImage */}
                  <DoctorCardImage doc={doc} />

                  {/* Doctor Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{doc.name}</h3>
                      <p className="text-xs font-semibold text-teal-800 mt-0.5">{doc.qualifications}</p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {doc.bio}
                    </p>

                    {/* Specialization Tags */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Specializations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.specializations?.slice(0, 4).map((spec, i) => (
                          <span
                            key={i}
                            className="bg-white text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-stone-200"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Languages & Location */}
                    <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-stone-200/60">
                      <div>
                        <strong>Languages:</strong> {doc.languages?.join(', ')}
                      </div>
                      <div>
                        <strong>Location:</strong> {doc.clinicAddress || 'Online Telehealth'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Fee & Direct Booking CTA */}
                <div className="p-6 pt-0">
                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Session Fee</span>
                      <span className="text-base font-black text-slate-900">₹{doc.sessionFee}</span>
                      <span className="text-[10px] text-slate-500"> / 50m session</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Slots Available
                    </span>
                  </div>

                  <Link
                    to={`/${doc.slug}`}
                    className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>View Profile & Book Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CLINICAL ETHICS, CONFIDENTIALITY & SECURITY */}
      <section className="py-16 sm:py-24 bg-[#FAF9F5] border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Clinical Security & Patient Confidentiality
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Serenova is designed strictly according to clinical privacy protocols and Indian mental healthcare laws.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Zero Clinical Notes Leakage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your doctor’s private SOAP and DAP notes are isolated in an encrypted practitioner vault. Diagnostic hypotheses and clinical impressions are never returned over client-facing endpoints.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">RCI & MHCA 2017 Compliance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practitioners operate in full compliance with Rehabilitation Council of India guidelines and the Mental Healthcare Act 2017, safeguarding client autonomy, voluntary informed consent, and emergency protocol handling.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Official SAC 999312 GST Invoices</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every booked consultation generates an official healthcare GST tax invoice with doctor credentials and SAC codes, ready for private insurance claim filing or medical reimbursement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-16 sm:py-24 bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Everything you need to know about starting your therapy journey on Serenova.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-stone-200 rounded-2xl overflow-hidden bg-[#FAF9F5] transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-stone-100/70 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-800 pr-4">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-stone-200/60 bg-white">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DUMMY 24/7 CRISIS HELPLINE SUPPORT NOTICE */}
      <section className="py-10 bg-slate-900 text-slate-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>24/7 Mental Health Emergency Resources</span>
          </div>
          <p className="text-xs max-w-2xl mx-auto text-slate-400 leading-relaxed">
            If you or someone you know is in immediate psychological distress, please connect with crisis support services immediately:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-white pt-2">
            <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              National Support Line: <span className="text-amber-400">1800-000-0000 (Toll Free Demo)</span>
            </span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              Crisis Counseling Desk: <span className="text-amber-400">1800-111-2222 (Toll Free Demo)</span>
            </span>
            <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              Emergency Helpline: <span className="text-amber-400">00000-00000 (Demo Helpline)</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthOverview;
