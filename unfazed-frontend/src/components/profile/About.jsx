import React from 'react';
import { HeartHandshake, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export const About = ({ therapist }) => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Main Philosophy */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-700" />
              <span>Therapeutic Approach & Philosophy</span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Therapy is a collaborative partnership built on unconditional positive regard, clinical rigor, and
              somatic attunement. Whether you are dealing with debilitating anxiety, difficult relationship choices, or
              prolonged exhaustion from corporate demands, we work together at your pace.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Every session integrates structured tools (thought records, behavioral experiments) with reflective,
              insight-oriented depth so you feel both immediate symptom relief and foundational healing.
            </p>
          </div>

          {/* Specializations & Modalities */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">
              Clinical Specializations & Modalities
            </h3>
            <div className="flex flex-wrap gap-2">
              {therapist.specializations?.map((spec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-teal-50 text-teal-900 border border-teal-200/60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Practice Highlights Sidecard - Spacious, Clean Two-Column Layout */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200/70">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Practice Standards</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="font-bold text-slate-900 w-28 flex-shrink-0">Duration:</span>
              <span className="text-slate-600 leading-relaxed">50 minutes standard clinical hour (45 / 60 / 90 available)</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="font-bold text-slate-900 w-28 flex-shrink-0">Confidentiality:</span>
              <span className="text-slate-600 leading-relaxed">Digital records encrypted, strict RCI ethical compliance</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="font-bold text-slate-900 w-28 flex-shrink-0">Payments:</span>
              <span className="text-slate-600 leading-relaxed">UPI, Cards, GST Tax Invoices automatically provided</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="font-bold text-slate-900 w-28 flex-shrink-0">Reminders:</span>
              <span className="text-slate-600 leading-relaxed">Automated WhatsApp & Email calendar confirmations</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80">
            <div className="p-3 bg-white rounded-xl border border-slate-200/70 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                Client Portal includes psychoeducation handouts, action worksheets, and private chat check-ins.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
