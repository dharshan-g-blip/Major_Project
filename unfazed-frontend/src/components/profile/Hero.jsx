import React from 'react';
import { ShieldCheck, MapPin, Globe, Clock, Award } from 'lucide-react';
import Button from '../common/Button';
import { getDoctorCardMeta } from '../../utils/doctorMeta';

export const Hero = ({ therapist, onBookClick }) => {
  const doctorMeta = getDoctorCardMeta(therapist?.name);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 to-teal-800 text-white py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Decorative subtle ambient glows */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Branded Medical Monogram Card (Like Ananya's Card) */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 flex flex-col items-center justify-center ring-4 ring-white/20 shadow-xl text-white text-center p-3 select-none">
              <span className="text-3xl sm:text-4xl font-black tracking-wider text-white drop-shadow-sm">
                {doctorMeta.initials}
              </span>
              <span className="text-xs sm:text-sm font-bold text-teal-100 mt-1 max-w-[130px] truncate">
                {doctorMeta.shortName}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-teal-300 font-semibold mt-0.5">
                {doctorMeta.subtitle}
              </span>
            </div>
            <div
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg flex items-center justify-center ring-2 ring-teal-900"
              title="RCI Licensed Practitioner"
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Info Details */}
          <div className="flex-1 text-center md:text-left space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-100 text-xs font-medium tracking-wide">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>{therapist?.qualifications || 'RCI Registered Mental Health Professional'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {therapist?.name}
            </h1>

            <p className="text-teal-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              {therapist?.bio || 'Evidence-based clinical psychotherapy tailored to your personal journey.'}
            </p>

            {/* Badges / Meta */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2 text-xs text-teal-200">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{therapist?.experienceYears || 5}+ Years Clinical Experience</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Languages: {therapist?.languages?.join(', ') || 'English, Hindi'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{therapist?.clinicAddress || 'Online Telehealth'}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Button size="lg" variant="secondary" onClick={onBookClick} className="w-full sm:w-auto shadow-lg font-bold">
                Book a Session (₹{therapist?.sessionFee || 2000})
              </Button>
              <span className="text-xs text-teal-200/90">
                100% Confidential • Instant Telehealth Confirmation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
