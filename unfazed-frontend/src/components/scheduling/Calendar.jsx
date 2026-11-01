import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalIcon, Clock, Video, User, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import Button from '../common/Button';

export const Calendar = ({ sessions, onUpdateStatus }) => {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Cancelled</span>;
      case 'no_show':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">No-Show</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Practice Calendar & Appointments</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredSessions.length} total sessions
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          {['all', 'scheduled', 'completed', 'cancelled', 'no_show'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg capitalize transition-all ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'no_show' ? 'No-Show' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Session Cards List */}
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No sessions match the selected filter.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const start = new Date(session.startTime);
            const dateStr = start.toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = start.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={session._id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Date Block */}
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-2.5 text-center min-w-[65px] flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-teal-700 block">
                      {start.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold text-teal-900 block leading-tight">
                      {start.getDate()}
                    </span>
                    <span className="text-[10px] text-teal-600 block">
                      {start.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{session.clientName}</h4>
                      {getStatusBadge(session.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeStr} ({session.durationMinutes} mins)
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {session.sessionType || 'Individual Psychotherapy'}
                      </span>
                      <span className="font-medium text-slate-700">₹{session.fee}</span>
                    </div>

                    {session.status === 'scheduled' && (
                      <div className="pt-1">
                        <Link
                          to={`/meet/${session._id}`}
                          className="inline-flex items-center gap-1 text-xs text-teal-800 hover:text-teal-900 font-semibold"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Virtual Session</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                {session.status === 'scheduled' && onUpdateStatus && (
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => onUpdateStatus(session._id, 'completed')}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-medium border border-emerald-200 flex items-center gap-1"
                      title="Mark Session Completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Complete</span>
                    </button>
                    <button
                      onClick={() => onUpdateStatus(session._id, 'no_show')}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium border border-rose-200 flex items-center gap-1"
                      title="Mark as No-Show"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">No-Show</span>
                    </button>
                    <button
                      onClick={() => onUpdateStatus(session._id, 'cancelled')}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-medium border border-amber-200 flex items-center gap-1"
                      title="Cancel Session"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Calendar;
