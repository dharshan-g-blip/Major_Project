import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import NoteEditor from '../../components/notes/NoteEditor';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { FileText, Plus, Lock, Share2, Tag, Trash2, Edit3, Shield } from 'lucide-react';

export const Notes = () => {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'private' | 'shared'
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get('clientId') || '');
  const [isEditorOpen, setIsEditorOpen] = useState(Boolean(searchParams.get('clientId')));

  const toast = useToast();

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const [notesRes, clientsRes] = await Promise.all([
        api.get('/notes', { params: { clientId: selectedClientId || undefined } }),
        api.get('/clients'),
      ]);

      if (notesRes.data.success) setNotes(notesRes.data.notes || []);
      if (clientsRes.data.success) setClients(clientsRes.data.clients || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedClientId]);

  const handleSaveNote = async (payload) => {
    try {
      const res = await api.post('/notes', payload);
      if (res.data.success) {
        setIsEditorOpen(false);
        toast.success(`Saved ${payload.type === 'private' ? 'private' : 'shared'} clinical note!`);
        fetchNotes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save note');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this clinical record?')) return;
    try {
      const res = await api.delete(`/notes/${id}`);
      if (res.data.success) {
        setNotes((prev) => prev.filter((n) => n._id !== id));
        toast.info('Clinical record deleted');
      }
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const selectedClient = clients.find((c) => c._id === selectedClientId) || clients[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-800" />
            <span>Clinical Documentation & EHR</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Restricted Storage: Private notes are strictly confidential; Shared notes are viewable by clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Client Filter Dropdown */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsEditorOpen(!isEditorOpen)}
          >
            {isEditorOpen ? 'Close Editor' : 'New Clinical Note'}
          </Button>
        </div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && selectedClient && (
        <NoteEditor
          client={selectedClient}
          onSave={handleSaveNote}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: `All Notes (${notes.length})` },
            { id: 'private', label: 'Private Clinical (Locked)', icon: Lock },
            { id: 'shared', label: 'Shared with Client', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredNotes.length} notes
        </span>
      </div>

      {/* Notes Stream */}
      {loading ? (
        <Loader message="Loading clinical documentation..." />
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No clinical notes found for this view. Click "New Clinical Note" above to write one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const isPrivate = note.type === 'private';
            return (
              <div
                key={note._id}
                className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isPrivate
                    ? 'border-amber-200/90 hover:border-amber-300'
                    : 'border-teal-200/90 hover:border-teal-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPrivate
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-teal-100 text-teal-900'
                      }`}
                    >
                      {isPrivate ? <Lock className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                      <span>{note.type} ({note.format})</span>
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{note.title}</h3>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Client: <strong>{note.client_id?.name || 'Assigned Client'}</strong>
                  </p>

                  {/* Body Content */}
                  {note.format === 'soap' ? (
                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <p><strong>Subjective:</strong> {note.soap?.subjective}</p>
                      <p><strong>Objective:</strong> {note.soap?.objective}</p>
                      <p><strong>Assessment:</strong> {note.soap?.assessment}</p>
                      <p><strong>Plan:</strong> {note.soap?.plan}</p>
                    </div>
                  ) : note.format === 'dap' ? (
                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <p><strong>Data:</strong> {note.dap?.data}</p>
                      <p><strong>Assessment:</strong> {note.dap?.assessment}</p>
                      <p><strong>Plan:</strong> {note.dap?.plan}</p>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm text-slate-700 max-w-none text-xs leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 max-h-36 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {note.tags?.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notes;
