import React, { useState } from 'react';
import { Search, Tag, Eye, ArrowUpDown, Plus, UserPlus } from 'lucide-react';
import Button from '../common/Button';

export const ClientTable = ({ clients, onSelectClient, onAddClientClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = clients
    .filter((client) => {
      const matchSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm));
      const matchStatus = statusFilter === 'all' || client.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Inactive</span>;
      case 'prospective':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Prospective</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {['all', 'active', 'prospective', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {onAddClientClick && (
          <Button size="sm" icon={UserPlus} onClick={onAddClientClick}>
            New Client
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-5 cursor-pointer" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1.5">
                  <span>Client</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Clinical Tags</th>
              <th className="py-3 px-5 cursor-pointer" onClick={() => toggleSort('totalSessions')}>
                <div className="flex items-center gap-1.5">
                  <span>Sessions</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-5 cursor-pointer" onClick={() => toggleSort('lastSessionDate')}>
                <div className="flex items-center gap-1.5">
                  <span>Last Session</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No clients found matching your query.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client._id}
                  onClick={() => onSelectClient(client)}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900">{client.name}</div>
                    <div className="text-[11px] text-slate-500">{client.email}</div>
                  </td>
                  <td className="py-3.5 px-5">{getStatusBadge(client.status)}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-wrap gap-1">
                      {client.tags?.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-700">
                    {client.totalSessions || 0}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    {client.lastSessionDate
                      ? new Date(client.lastSessionDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClient(client);
                      }}
                      className="py-1 px-2.5 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Chart
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;
