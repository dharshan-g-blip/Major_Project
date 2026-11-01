import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import Calendar from '../../components/scheduling/Calendar';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Calendar as CalIcon, Clock, Settings, Save, CheckCircle2, Zap } from 'lucide-react';

export const Schedule = () => {
  const [sessions, setSessions] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const toast = useToast();

  const autofillStandardSchedule = () => {
    const days = [
      { dayOfWeek: 1, dayName: 'Monday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 2, dayName: 'Tuesday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 3, dayName: 'Wednesday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 4, dayName: 'Thursday', isActive: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
      { dayOfWeek: 5, dayName: 'Friday', isActive: true, slots: [{ startTime: '10:00', endTime: '17:00' }] },
      { dayOfWeek: 6, dayName: 'Saturday', isActive: true, slots: [{ startTime: '10:00', endTime: '14:00' }] },
      { dayOfWeek: 0, dayName: 'Sunday', isActive: false, slots: [] },
    ];
    setAvailability((prev) => ({
      ...prev,
      bufferTimeMinutes: 15,
      weeklySchedule: days,
    }));
    toast.info('Standard Practice Hours (10 AM - 6 PM Mon-Fri) loaded!');
  };

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, availRes] = await Promise.all([
        api.get('/scheduling/sessions'),
        api.get('/scheduling/availability'),
      ]);

      if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions || []);
      if (availRes.data.success) setAvailability(availRes.data.availability);
    } catch (err) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      const res = await api.patch(`/scheduling/sessions/${sessionId}`, { status });
      if (res.data.success) {
        setSessions((prev) =>
          prev.map((s) => (s._id === sessionId ? { ...s, status } : s))
        );
        toast.success(`Session marked as ${status.replace('_', ' ')}`);
      }
    } catch (err) {
      toast.error('Failed to update session status');
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await api.put('/scheduling/availability', availability);
      if (res.data.success) {
        setSaveSuccess(true);
        toast.success('Availability template updated successfully!');
        setTimeout(() => {
          setSaveSuccess(false);
          setSettingsModalOpen(false);
        }, 1200);
      }
    } catch (err) {
      toast.error('Failed to update availability');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalIcon className="w-6 h-6 text-teal-800" />
            <span>Practice Calendar & Appointments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View booked sessions, manage clinical availability, buffer intervals, and track attendance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Settings}
          onClick={() => setSettingsModalOpen(true)}
        >
          Availability Settings
        </Button>
      </div>

      {loading ? (
        <Loader message="Synchronizing calendar..." />
      ) : (
        <Calendar sessions={sessions} onUpdateStatus={handleUpdateStatus} />
      )}

      {/* Availability Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Weekly Availability & Rest Buffer Configuration"
        maxWidth="max-w-2xl"
      >
        {availability && (
          <form onSubmit={handleSaveAvailability} className="space-y-6">
            <div className="bg-teal-50 border border-teal-200/80 p-3 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-teal-950 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-700 fill-teal-700" />
                <span>Quick Preset:</span>
              </span>
              <button
                type="button"
                onClick={autofillStandardSchedule}
                className="text-xs font-bold text-teal-900 bg-white hover:bg-teal-100/50 px-3 py-1 rounded-xl border border-teal-200 shadow-xs transition-colors"
              >
                ⚡ Load Standard Practice Hours (10 AM - 6 PM)
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Availability rules saved successfully!</span>
              </div>
            )}

            {/* Buffer & Durations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Buffer Time Between Sessions (Minutes)
                </label>
                <input
                  type="number"
                  value={availability.bufferTimeMinutes || 15}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      bufferTimeMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Prevents back-to-back fatigue by adding pause between sessions.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Primary Practice Timezone
                </label>
                <input
                  type="text"
                  readOnly
                  value={availability.timezone || 'Asia/Kolkata'}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Indian Standard Time (IST)
                </span>
              </div>
            </div>

            {/* Days Schedule */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Recurring Weekly Working Windows
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {availability.weeklySchedule?.map((day, idx) => (
                  <div
                    key={day.dayOfWeek}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 min-w-[100px]">
                      <input
                        type="checkbox"
                        checked={day.isActive}
                        onChange={(e) => {
                          const updated = [...availability.weeklySchedule];
                          updated[idx].isActive = e.target.checked;
                          setAvailability({ ...availability, weeklySchedule: updated });
                        }}
                        className="rounded text-teal-800"
                      />
                      <span>{day.dayName}</span>
                    </label>

                    {day.isActive ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Working Hours:</span>
                        <input
                          type="text"
                          value={day.slots?.[0]?.startTime || '10:00'}
                          onChange={(e) => {
                            const updated = [...availability.weeklySchedule];
                            if (!updated[idx].slots[0]) updated[idx].slots[0] = {};
                            updated[idx].slots[0].startTime = e.target.value;
                            setAvailability({ ...availability, weeklySchedule: updated });
                          }}
                          className="w-16 p-1 border rounded text-center text-xs"
                        />
                        <span>to</span>
                        <input
                          type="text"
                          value={day.slots?.[0]?.endTime || '18:00'}
                          onChange={(e) => {
                            const updated = [...availability.weeklySchedule];
                            if (!updated[idx].slots[0]) updated[idx].slots[0] = {};
                            updated[idx].slots[0].endTime = e.target.value;
                            setAvailability({ ...availability, weeklySchedule: updated });
                          }}
                          className="w-16 p-1 border rounded text-center text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Off / Clinic Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSettingsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={savingSettings}>
                Save Availability
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Schedule;
