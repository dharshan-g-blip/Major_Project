import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import Hero from '../../components/profile/Hero';
import About from '../../components/profile/About';
import ServiceCard from '../../components/profile/ServiceCard';
import SlotPicker from '../../components/scheduling/SlotPicker';
import CheckoutForm from '../../components/payments/CheckoutForm';
import InvoiceView from '../../components/payments/InvoiceView';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle,
  Calendar,
  ShieldCheck,
  Video,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  UserCheck,
  HeartHandshake,
} from 'lucide-react';

export const BookingPage = () => {
  const { slug } = useParams();
  const { clientUser } = useAuth();
  const toast = useToast();
  const [therapist, setTherapist] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Booking Flow State
  const [bookingStep, setBookingStep] = useState(1); // 1: Slot, 2: Intake & Consent, 3: Payment, 4: Confirmed
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookedSession, setBookedSession] = useState(null);
  const [bookedClient, setBookedClient] = useState(null);
  const [completedPayment, setCompletedPayment] = useState(null);

  // Intake & Consent Form Data
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Prefer not to say',
    occupation: '',
    emergencyContact: '',
    emergencyPhone: '',
    presentingConcern: '',
    goals: '',
    consentAgreed: false,
  });

  const [showOptionalIntake, setShowOptionalIntake] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);

  const bookingRef = useRef(null);

  // Comprehensive Demo Client Profiles
  const demoClientsData = {
    'rohan.verma@example.com': {
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      phone: '+91 99887 76655',
      dob: '1992-06-14',
      gender: 'Male',
      occupation: 'Staff Software Engineer at Fintech startup',
      emergencyContact: 'Neha Verma (Spouse)',
      emergencyPhone: '+91 99887 76654',
      presentingConcern: 'Persistent palpitations and dread before sprint reviews and standups. Chronic sleep onset insomnia.',
      goals: 'Learn tangible CBT techniques to de-escalate anxiety and establish firm boundaries.',
      consentAgreed: true,
    },
    'pooja.iyer@example.com': {
      name: 'Pooja Iyer',
      email: 'pooja.iyer@example.com',
      phone: '+91 98221 44556',
      dob: '1995-11-20',
      gender: 'Female',
      occupation: 'Senior Content Strategist',
      emergencyContact: 'Karthik Iyer (Brother)',
      emergencyPhone: '+91 98221 44557',
      presentingConcern: 'Work-life balance, imposter syndrome in leadership position.',
      goals: 'Self-compassion practice and stress reduction.',
      consentAgreed: true,
    },
    'vikram.rao@example.com': {
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@example.com',
      phone: '+91 98332 55667',
      dob: '1989-03-25',
      gender: 'Male',
      occupation: 'Product Manager in Healthcare Tech',
      emergencyContact: 'Sunita Rao (Mother)',
      emergencyPhone: '+91 98332 55668',
      presentingConcern: 'Adult ADHD executive dysfunction, task paralysis, depressive low-energy episodes.',
      goals: 'Develop psychological flexibility with ACT and concrete executive functioning routines.',
      consentAgreed: true,
    },
    'sneha.kapoor@example.com': {
      name: 'Sneha Kapoor',
      email: 'sneha.kapoor@example.com',
      phone: '+91 98443 66778',
      dob: '1994-08-12',
      gender: 'Female',
      occupation: 'Architect & Urban Designer',
      emergencyContact: 'Ankit Kapoor (Sibling)',
      emergencyPhone: '+91 98443 66779',
      presentingConcern: 'Generalized anxiety and panic episodes around creative critique deadlines.',
      goals: 'Deconstruct catastrophizing loops and build grounding strategies.',
      consentAgreed: true,
    },
    'aarav.malhotra@example.com': {
      name: 'Aarav Malhotra',
      email: 'aarav.malhotra@example.com',
      phone: '+91 98554 77889',
      dob: '1991-12-05',
      gender: 'Male',
      occupation: 'Management Consultant',
      emergencyContact: 'Rhea Malhotra (Spouse)',
      emergencyPhone: '+91 98554 77880',
      presentingConcern: 'Relational friction, communication breakdown in long-term partnership.',
      goals: 'Deepen emotional attunement using Emotion-Focused Therapy.',
      consentAgreed: true,
    },
    'meera.sen@example.com': {
      name: 'Meera Sen',
      email: 'meera.sen@example.com',
      phone: '+91 98665 88990',
      dob: '1996-04-18',
      gender: 'Female',
      occupation: 'UX Research Lead',
      emergencyContact: 'Debashish Sen (Father)',
      emergencyPhone: '+91 98665 88991',
      presentingConcern: 'Attachment anxiety, difficulty with emotional vulnerability.',
      goals: 'Build emotional safety and heal core attachment injuries.',
      consentAgreed: true,
    },
  };

  // Automatically sync with logged in client account, or localStorage
  useEffect(() => {
    // 1. If user is logged in as a client, pre-fill with their active account details
    if (clientUser && clientUser.email) {
      const emailKey = clientUser.email.toLowerCase().trim();
      const demoDetails = demoClientsData[emailKey];
      if (demoDetails) {
        setClientForm(demoDetails);
      } else {
        setClientForm((prev) => ({
          ...prev,
          name: clientUser.name || prev.name,
          email: clientUser.email || prev.email,
          phone: clientUser.phone || prev.phone,
          ...(clientUser.intakeForm || {}),
          consentAgreed: true,
        }));
      }
      setIsAutofilled(true);
      setShowOptionalIntake(true);
      return;
    }

    // 2. Otherwise fallback to previously booked client from localStorage
    try {
      const savedClient = localStorage.getItem('unfazed_client');
      if (savedClient) {
        const parsed = JSON.parse(savedClient);
        if (parsed.name && parsed.email) {
          setClientForm((prev) => ({
            ...prev,
            ...parsed,
            consentAgreed: true,
          }));
          setIsAutofilled(true);
        }
      }
    } catch (e) {
      // Ignore
    }
  }, [clientUser]);

  // Dynamic Autofill Action: Fills the LOGGED IN user's account details,
  // or if guest, fills the client matching this specific doctor!
  const autofillActiveClient = () => {
    if (clientUser && clientUser.email) {
      const emailKey = clientUser.email.toLowerCase().trim();
      const demoDetails = demoClientsData[emailKey];
      if (demoDetails) {
        setClientForm(demoDetails);
      } else {
        setClientForm((prev) => ({
          ...prev,
          name: clientUser.name,
          email: clientUser.email,
          phone: clientUser.phone || '',
          consentAgreed: true,
        }));
      }
    } else {
      // Guest booking: match client to the therapist being booked
      if (slug === 'dr-menon') {
        setClientForm(demoClientsData['vikram.rao@example.com']);
      } else if (slug === 'dr-nair') {
        setClientForm(demoClientsData['aarav.malhotra@example.com']);
      } else {
        setClientForm(demoClientsData['rohan.verma@example.com']);
      }
    }
    setIsAutofilled(true);
    setShowOptionalIntake(true);
  };

  const clearAutofill = () => {
    setClientForm({
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'Prefer not to say',
      occupation: '',
      emergencyContact: '',
      emergencyPhone: '',
      presentingConcern: '',
      goals: '',
      consentAgreed: false,
    });
    setIsAutofilled(false);
    localStorage.removeItem('unfazed_client');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/therapist/profile/${slug || 'dr-sharma'}`);
        if (res.data.success) {
          setTherapist(res.data.therapist);
          setPackages(res.data.packages || []);
          // Set page meta tags
          if (res.data.openGraph) {
            document.title = res.data.openGraph.title;
          }
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Therapist profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectService = (service) => {
    setSelectedPackage(null);
    scrollToBooking();
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    scrollToBooking();
  };

  const handleSlotPicked = (slot, tz) => {
    setSelectedSlot(slot);
    setSelectedTimezone(tz);
  };

  // Cancel active booking and release any reserved appointment slot
  const handleCancelBooking = async () => {
    if (bookedSession?._id) {
      try {
        await api.post('/scheduling/cancel', {
          sessionId: bookedSession._id,
          cancellationReason: 'Cancelled by client during booking flow',
        });
      } catch (err) {
        console.warn('[Cancel Booking] Error releasing session slot:', err.message);
      }
    }

    setBookingStep(1);
    setSelectedSlot(null);
    setBookedSession(null);
    setBookedClient(null);
    setCompletedPayment(null);

    scrollToBooking();
    toast?.info('Booking cancelled. You can select another date and time whenever you are ready.');
  };

  // Cancel an already confirmed appointment
  const handleCancelConfirmedSession = async () => {
    if (!bookedSession?._id) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your confirmed session with ${therapist.name}? The slot will be released.`
    );
    if (!confirmCancel) return;

    try {
      await api.post('/scheduling/cancel', {
        sessionId: bookedSession._id,
        cancellationReason: 'Cancelled by client from confirmation screen',
      });
      toast?.success('Your appointment has been cancelled successfully.');
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Failed to cancel appointment');
    }

    setBookingStep(1);
    setSelectedSlot(null);
    setBookedSession(null);
    setBookedClient(null);
    setCompletedPayment(null);
    scrollToBooking();
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!clientForm.consentAgreed) {
      alert('Please check the digital informed consent agreement to proceed with clinical scheduling.');
      return;
    }

    try {
      // Create session booking in backend
      const res = await api.post('/scheduling/book', {
        slug: therapist.slug,
        clientName: clientForm.name,
        clientEmail: clientForm.email,
        clientPhone: clientForm.phone,
        startTime: selectedSlot.startTime,
        durationMinutes: selectedSlot.durationMinutes || 50,
        fee: selectedPackage ? selectedPackage.totalPrice : therapist.sessionFee,
        timezone: selectedTimezone,
        intakeData: {
          dob: clientForm.dob,
          gender: clientForm.gender,
          occupation: clientForm.occupation,
          emergencyContact: clientForm.emergencyContact,
          emergencyPhone: clientForm.emergencyPhone,
          presentingConcern: clientForm.presentingConcern,
          goals: clientForm.goals,
        },
        consentAgreed: clientForm.consentAgreed,
      });

      if (res.data.success) {
        // Save client info into localStorage for frictionless future visits
        try {
          localStorage.setItem('unfazed_client', JSON.stringify({
            name: clientForm.name,
            email: clientForm.email,
            phone: clientForm.phone,
            dob: clientForm.dob,
            occupation: clientForm.occupation,
            emergencyContact: clientForm.emergencyContact,
            emergencyPhone: clientForm.emergencyPhone,
            presentingConcern: clientForm.presentingConcern,
            goals: clientForm.goals,
          }));
        } catch (e) {}

        setBookedSession(res.data.session);
        setBookedClient(res.data.client || { _id: res.data.session?.client_id, name: clientForm.name, email: clientForm.email });
        setBookingStep(3); // Proceed to payment
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reserve appointment slot');
    }
  };

  const handlePaymentDone = (payment) => {
    setCompletedPayment(payment);
    setBookingStep(4); // Confirmed
  };

  if (loading) return <Loader message="Loading practitioner profile..." size="lg" />;
  if (errorMsg || !therapist) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">{errorMsg || 'The requested branded link does not exist.'}</p>
        <Link to="/" className="inline-block mt-4 text-xs font-bold text-teal-800 underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <Hero therapist={therapist} onBookClick={scrollToBooking} />

      {/* About & Modalities */}
      <About therapist={therapist} />

      {/* Services & Packages Grid */}
      <ServiceCard
        therapist={therapist}
        packages={packages}
        onSelectService={handleSelectService}
        onSelectPackage={handleSelectPackage}
      />

      {/* Interactive Booking & Intake Anchor */}
      <section ref={bookingRef} className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>Frictionless Clinical Scheduling</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Book Your Session with {therapist.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            {selectedPackage ? `Package Selected: ${selectedPackage.name}` : `Standard 50-minute consultation (₹${therapist.sessionFee})`}
          </p>
        </div>

        {/* Multi-Step Indicator & Quick Cancel Option */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
          <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
            {[
              { step: 1, label: 'Select Time' },
              { step: 2, label: 'Intake & Consent' },
              { step: 3, label: 'Advance Payment' },
              { step: 4, label: 'Confirmed' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    bookingStep === item.step
                      ? 'bg-teal-800 text-white shadow-sm ring-2 ring-teal-700/30'
                      : bookingStep > item.step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {bookingStep > item.step ? '✓' : item.step}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-medium ${
                    bookingStep === item.step ? 'text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                {item.step < 4 && <div className="w-6 h-0.5 bg-slate-200 hidden sm:block" />}
              </div>
            ))}
          </div>

          {bookingStep > 1 && bookingStep < 4 && (
            <button
              type="button"
              onClick={handleCancelBooking}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Booking</span>
            </button>
          )}
        </div>

        {/* Selected Package Banner */}
        {selectedPackage && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Multi-Session Package Bundle
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedPackage.name}</h4>
              <p className="text-xs text-slate-600">
                ₹{selectedPackage.totalPrice} total • {selectedPackage.sessionCount} sessions (₹{selectedPackage.perSessionRate}/session)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPackage(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline self-start sm:self-auto"
            >
              Switch to Single Session (₹{therapist.sessionFee})
            </button>
          </div>
        )}

        {/* Step 1: Select Slot */}
        {bookingStep === 1 && (
          <div className="space-y-6">
            <SlotPicker
              therapistSlug={therapist.slug}
              onSlotSelected={handleSlotPicked}
              selectedDuration={50}
            />

            <div className="flex justify-end">
              <Button
                size="lg"
                disabled={!selectedSlot}
                onClick={() => setBookingStep(2)}
                className="w-full sm:w-auto"
              >
                <span>Continue to Intake & Consent</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Intake Form & Digital Consent */}
        {bookingStep === 2 && (
          <form
            onSubmit={handleIntakeSubmit}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
          >
            {/* Selected Slot Summary Banner */}
            {selectedSlot && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      Selected Appointment
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                      {new Date(selectedSlot.startTime).toLocaleString('en-IN', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}{' '}
                      • {selectedSlot.durationMinutes || 50} mins
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingStep(1)}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 underline self-start sm:self-auto"
                >
                  Change Slot
                </button>
              </div>
            )}

            {/* Header & Autofill Bar */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Your Contact Details & Quick Intake</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast 1-minute booking. Intake notes are confidential and encrypted.
                  </p>
                </div>

                {/* Dynamic Autofill based on Logged-in Client */}
                <div className="flex flex-wrap items-center gap-2">
                  {clientUser ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Logged in: <strong>{clientUser.name}</strong></span>
                      </span>
                      <button
                        type="button"
                        onClick={autofillActiveClient}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span>Autofill My Details</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={autofillActiveClient}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 text-teal-900 rounded-xl text-xs font-bold border border-teal-200/90 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>
                        Autofill Demo Client (
                        {slug === 'dr-menon'
                          ? 'Vikramaditya Rao'
                          : slug === 'dr-nair'
                          ? 'Aarav Malhotra'
                          : 'Rohan Verma'}
                        )
                      </span>
                    </button>
                  )}

                  {isAutofilled && (
                    <button
                      type="button"
                      onClick={clearAutofill}
                      className="px-2.5 py-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs flex items-center gap-1"
                      title="Clear autofill"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {isAutofilled && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>
                    <strong>Autofilled!</strong> Details pre-loaded from {clientUser ? `your active account (${clientUser.name})` : 'verified client record'}. You can review and edit below.
                  </span>
                </div>
              )}
            </div>

            {/* Core Required Fields - Clean & Simple */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block mb-3">
                1. Contact Information (Required)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="e.g. Rohan Verma"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="rohan@example.com"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="+91 99887 76655"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:bg-white focus:outline-none font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used exclusively to send encrypted session meeting links & reminders.
                </span>
              </div>
            </div>

            {/* Optional Intake & Clinical Context (Collapsible Accordion) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowOptionalIntake(!showOptionalIntake)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-teal-800" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      2. Pre-Session Clinical Notes & Background (Optional)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Share presenting concerns or emergency contacts if you wish, or discuss verbally during consultation.
                    </span>
                  </div>
                </div>
                {showOptionalIntake ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showOptionalIntake && (
                <div className="p-4 pt-2 border-t border-slate-200/80 space-y-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={clientForm.dob}
                        onChange={(e) => setClientForm({ ...clientForm, dob: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Occupation</label>
                      <input
                        type="text"
                        value={clientForm.occupation}
                        onChange={(e) => setClientForm({ ...clientForm, occupation: e.target.value })}
                        placeholder="e.g. Software Engineer, Designer, Student..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      What brings you to therapy? (Presenting Concern)
                    </label>
                    <textarea
                      rows={3}
                      value={clientForm.presentingConcern}
                      onChange={(e) => setClientForm({ ...clientForm, presentingConcern: e.target.value })}
                      placeholder="Share what you are feeling (e.g. workplace anxiety, relationship transition, burnout, panic)..."
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={clientForm.emergencyContact}
                        onChange={(e) => setClientForm({ ...clientForm, emergencyContact: e.target.value })}
                        placeholder="Spouse, sibling, parent, trusted friend"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        value={clientForm.emergencyPhone}
                        onChange={(e) => setClientForm({ ...clientForm, emergencyPhone: e.target.value })}
                        placeholder="+91 99887 76654"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Digital Informed Consent Box */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-800" />
                <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider">
                  3. Digital Informed Consent & Privacy (Required)
                </h4>
              </div>
              <p className="text-[11px] text-teal-900/80 leading-relaxed">
                Psychotherapy is a confidential, collaborative clinical process. By booking, you agree to attend on
                time, understand the standard 24-hour rescheduling policy, and consent to telehealth/in-person care
                under the Mental Healthcare Act 2017.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={clientForm.consentAgreed}
                  onChange={(e) => setClientForm({ ...clientForm, consentAgreed: e.target.checked })}
                  className="mt-0.5 rounded text-teal-800 focus:ring-teal-700 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  I give my voluntary digital informed consent to schedule therapy with {therapist.name}.
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <Button variant="outline" size="md" onClick={() => setBookingStep(1)}>
                  ← Back to Slots
                </Button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Booking</span>
                </button>
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Advance Payment */}
        {bookingStep === 3 && (
          <div className="space-y-6">
            <CheckoutForm
              therapist={therapist}
              client={
                bookedClient ||
                clientUser || {
                  _id: bookedSession?.client_id,
                  name: clientForm.name,
                  email: clientForm.email,
                  phone: clientForm.phone,
                }
              }
              session={bookedSession}
              packageData={selectedPackage}
              amount={selectedPackage ? selectedPackage.totalPrice : therapist.sessionFee}
              itemDescription={selectedPackage ? selectedPackage.name : 'Individual Psychotherapy Session'}
              onPaymentSuccess={handlePaymentDone}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setBookingStep(2)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Intake Form</span>
              </button>

              <button
                type="button"
                onClick={handleCancelBooking}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all shadow-xs"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Booking & Return to Start</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation Screen */}
        {bookingStep === 4 && (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 shadow-md text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Your Session is Confirmed!</h3>
              <p className="text-sm text-slate-600 mt-1">
                A calendar invitation and WhatsApp confirmation have been scheduled for {clientForm.name}.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl max-w-md mx-auto text-xs text-slate-600 space-y-2 border border-slate-100 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Practitioner:</span>
                <span className="font-bold text-slate-800">{therapist.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(bookedSession?.startTime).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Meeting Room:</span>
                <Link
                  to={`/meet/${bookedSession?._id}`}
                  className="font-bold text-teal-800 underline inline-flex items-center gap-1 hover:text-teal-900"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Launch Telehealth Video Room</span>
                </Link>
              </div>
            </div>

            {completedPayment && (
              <div className="max-w-md mx-auto">
                <InvoiceView payment={completedPayment} />
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/portal?email=${encodeURIComponent(clientForm.email)}&therapist=${therapist.slug}`}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Open Client Portal
              </Link>
              <button
                onClick={() => {
                  setBookingStep(1);
                  setSelectedSlot(null);
                  setBookedSession(null);
                  setBookedClient(null);
                  setCompletedPayment(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Book Another Appointment
              </button>
              <button
                type="button"
                onClick={handleCancelConfirmedSession}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Appointment</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default BookingPage;
