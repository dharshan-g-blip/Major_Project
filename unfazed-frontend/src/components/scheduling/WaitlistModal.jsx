import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { Clock, Send, BellRing, CheckCircle2 } from 'lucide-react';

export const WaitlistModal = ({ isOpen, onClose, therapistSlug, targetDate }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredTimes: 'Evening (5 PM - 8 PM)',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/scheduling/waitlist', {
        slug: therapistSlug,
        date: targetDate,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preferredTimes: formData.preferredTimes,
      });

      if (res.data.success) {
        setSuccess(true);
        toast.success('Added to priority waitlist!');
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Priority Slot Waitlist" maxWidth="max-w-md">
      {success ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">You are on the Waitlist!</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            If an appointment slot opens up on {targetDate || 'upcoming days'}, you will automatically receive an instant WhatsApp and email notification.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-teal-50 border border-teal-200/80 rounded-xl p-3 flex items-start gap-2.5">
            <BellRing className="w-4 h-4 text-teal-800 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-teal-900">
              When existing clients reschedule, waitlist members get first access to open consultation slots.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aditi Sen"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="aditi@example.com"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Time Window</label>
            <select
              value={formData.preferredTimes}
              onChange={(e) => setFormData({ ...formData, preferredTimes: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
              <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
              <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
              <option value="Any Available Time">Any Available Time</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Join Waitlist
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default WaitlistModal;
