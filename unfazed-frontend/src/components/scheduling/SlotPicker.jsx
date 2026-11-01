import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Calendar as CalendarIcon, Clock, Globe, AlertCircle, CheckCircle, BellRing } from 'lucide-react';
import Loader from '../common/Loader';
import Button from '../common/Button';
import WaitlistModal from './WaitlistModal';

// Helper to format local Date in "YYYY-MM-DD" without UTC day shifting
const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SlotPicker = ({ therapistSlug, onSlotSelected, selectedDuration = 50 }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatLocalDate(tomorrow);
  });
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const timezones = [
    { label: 'India Standard Time (IST) - GMT+5:30', value: 'Asia/Kolkata' },
    { label: 'Gulf Standard Time (GST) - GMT+4:00', value: 'Asia/Dubai' },
    { label: 'British Summer Time (BST) - GMT+1:00', value: 'Europe/London' },
    { label: 'Eastern Time (ET) - GMT-4:00', value: 'America/New_York' },
    { label: 'Pacific Time (PT) - GMT-7:00', value: 'America/Los_Angeles' },
    { label: 'Singapore / Malaysia (SGT) - GMT+8:00', value: 'Asia/Singapore' },
  ];

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !therapistSlug) return;
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await api.get(`/scheduling/open-slots/${therapistSlug}`, {
          params: {
            date: selectedDate,
            durationMinutes: selectedDuration,
            timezone,
          },
        });
        if (res.data.success) {
          setSlots(res.data.slots || []);
          if (res.data.slots?.length === 0) {
            setSelectedSlot(null);
          }
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to fetch available slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, therapistSlug, selectedDuration, timezone]);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    if (onSlotSelected) {
      onSlotSelected(slot, timezone);
    }
  };

  // Generate 7 upcoming day buttons with timezone-safe local date formatting
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: formatLocalDate(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-800" />
            <span>Select Date & Time</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Slots are dynamically calculated with {selectedDuration}-minute clinical duration and rest buffers.
          </p>
        </div>

        {/* Timezone Switcher */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Carousel / Selector */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
        {dateOptions.map((item) => {
          const isSelected = selectedDate === item.iso;
          return (
            <button
              key={item.iso}
              type="button"
              onClick={() => {
                setSelectedDate(item.iso);
                setSelectedSlot(null);
              }}
              className={`p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-teal-800 bg-teal-800 text-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-medium uppercase opacity-80">{item.dayName}</div>
              <div className="text-lg font-bold">{item.dayNumber}</div>
              <div className="text-[10px] opacity-70">{item.month}</div>
            </button>
          );
        })}
      </div>

      {/* Slots List */}
      <div className="min-h-[160px]">
        {loading ? (
          <Loader message="Loading available therapist slots..." size="sm" />
        ) : errorMsg ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-slate-700">No open slots on this date</p>
              <p className="text-xs text-slate-500 mt-0.5">Please select another date above or join the priority waitlist.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={BellRing}
              onClick={() => setWaitlistOpen(true)}
              className="text-xs"
            >
              Join Priority Waitlist for This Date
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((slot, index) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    <span>{slot.formattedTime}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setWaitlistOpen(true)}
                className="text-[11px] text-teal-800 hover:underline flex items-center gap-1 font-medium"
              >
                <BellRing className="w-3 h-3" />
                <span>Prefer a different time? Join waitlist</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        therapistSlug={therapistSlug}
        targetDate={selectedDate}
      />

      {selectedSlot && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between bg-teal-50/50 p-3 rounded-xl border border-teal-100">
          <div className="flex items-center gap-2 text-xs text-teal-900 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>
              Selected Time: <strong>{selectedSlot.formattedTime}</strong> ({timezone})
            </span>
          </div>
          <span className="text-[11px] text-teal-700 bg-teal-100 px-2 py-0.5 rounded font-semibold">
            {selectedDuration} mins
          </span>
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
