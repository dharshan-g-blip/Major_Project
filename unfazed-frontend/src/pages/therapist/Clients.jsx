import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import ClientTable from '../../components/crm/ClientTable';
import ClientCard from '../../components/crm/ClientCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import UpgradeModal from '../../components/common/UpgradeModal';
import useEntitlement from '../../hooks/useEntitlement';
import { Users, UserPlus, Sparkles, AlertCircle, Zap } from 'lucide-react';

export const Clients = () => {
  const [clients, setClients] = useState([]);
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    tags: 'Individual Therapy',
    status: 'active',
  });
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    entitlements,
    checkCanCreateClient,
    blockedModalState,
    closeUpgradePrompt,
  } = useEntitlement();

  const toast = useToast();

  const autofillDemoClient = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setNewClient({
      name: 'Sunita Rao',
      email: `sunita.rao${randomSuffix}@example.com`,
      phone: '+91 99201 88776',
      tags: 'Individual Therapy, Panic Disorder, Mindfulness',
      status: 'active',
    });
    toast.info('Sample client details auto-filled!');
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      if (res.data.success) {
        setClients(res.data.clients || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = async (client) => {
    try {
      const res = await api.get(`/clients/${client._id}`);
      if (res.data.success) {
        setSelectedClientData(res.data);
      }
    } catch (err) {
      alert('Failed to load client chart details');
    }
  };

  const handleOpenAddClient = () => {
    const allowed = checkCanCreateClient();
    if (allowed) {
      setAddModalOpen(true);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrorMessage('');
    try {
      const res = await api.post('/clients', {
        ...newClient,
        tags: newClient.tags.split(',').map((t) => t.trim()),
      });
      if (res.data.success) {
        setAddModalOpen(false);
        setNewClient({ name: '', email: '', phone: '', tags: 'Individual Therapy', status: 'active' });
        toast.success(`Client ${newClient.name} added successfully!`);
        fetchClients();
      }
    } catch (err) {
      if (err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setAddModalOpen(false);
        toast.error('Active client limit reached on current tier');
        checkCanCreateClient(); // Will trigger upgrade modal
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to create client');
        toast.error(err.response?.data?.message || 'Failed to create client');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <UpgradeModal
        isOpen={blockedModalState.isOpen}
        onClose={closeUpgradePrompt}
        state={blockedModalState}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-800" />
            <span>Practice Client CRM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your patient roster, clinical tags, intake documentation, and session histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium shadow-xs">
            Capacity:{' '}
            <strong>
              {entitlements?.activeClientsCount} /{' '}
              {entitlements?.activeClientsCap === 999999 ? 'Unlimited' : entitlements?.activeClientsCap}
            </strong>{' '}
            clients
          </div>
          <Button icon={UserPlus} variant="primary" size="sm" onClick={handleOpenAddClient}>
            Add Client
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading client roster..." />
      ) : selectedClientData ? (
        <ClientCard
          clientData={selectedClientData}
          onClose={() => setSelectedClientData(null)}
          onNewNoteClick={() => {
            window.location.href = `/therapist/notes?clientId=${selectedClientData.client._id}`;
          }}
        />
      ) : (
        <ClientTable
          clients={clients}
          onSelectClient={handleSelectClient}
          onAddClientClick={handleOpenAddClient}
        />
      )}

      {/* Add Client Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Client Record"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="bg-teal-50 border border-teal-200/80 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs text-teal-950 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal-700 fill-teal-700" />
              <span>Quick Test Lead:</span>
            </span>
            <button
              type="button"
              onClick={autofillDemoClient}
              className="text-xs font-bold text-teal-900 bg-white hover:bg-teal-100/50 px-2.5 py-1 rounded-lg border border-teal-200 shadow-xs transition-colors"
            >
              ⚡ Autofill Sample Client
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              placeholder="e.g. Vikramaditya Rao"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                placeholder="client@domain.com"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Clinical Tags (comma separated)
            </label>
            <input
              type="text"
              value={newClient.tags}
              onChange={(e) => setNewClient({ ...newClient, tags: e.target.value })}
              placeholder="Weekly CBT, Anxiety, Workplace Burnout"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={creating}>
              Save Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;
