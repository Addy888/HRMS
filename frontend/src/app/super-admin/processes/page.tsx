'use client';

import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Loader2,
  Users,
  IndianRupee,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface CreateProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProcessModal = ({ isOpen, onClose }: CreateProcessModalProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    name: '',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      await api.post('/super-admin/processes', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-processes'] });
      onClose();
      setForm({ name: '', description: '' });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to create process'),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-heading text-xl font-bold text-card-foreground">Create Process</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-card-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
              Process Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Sales, VTP, Customer Support"
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the process/department"
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {createMutation.isPending ? 'Creating...' : 'Create Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function SuperAdminProcessesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const { data: processes, isLoading } = useQuery({
    queryKey: ['super-admin-processes'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/process-overview');
      return res.data.data || res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/processes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-processes'] });
    },
    onError: (e: any) => alert(e.response?.data?.message || 'Failed to delete process'),
  });

  const filteredProcesses = React.useMemo(() => {
    if (!processes) return [];
    if (!search) return processes;
    
    return processes.filter((process: any) =>
      process.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [processes, search]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-3">
              <Layers className="w-8 h-8 text-purple-500" />
              Process Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage departments and processes across the organization
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Process
          </button>
        </div>

        {/* Search */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search processes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Process Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProcesses.length > 0 ? (
              filteredProcesses.map((process: any) => (
                <div
                  key={process.id}
                  className="bg-card border border-border hover:border-purple-500/50 rounded-2xl p-6 transition-all group shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                      <Layers className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          if (confirm(`Delete process "${process.name}"?`)) {
                            deleteMutation.mutate(process.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete process"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-card-foreground mb-2 group-hover:text-purple-600 transition-colors">
                    {process.name}
                  </h3>
                  
                  {process.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {process.description}
                    </p>
                  )}

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Employees
                      </span>
                      <span className="text-card-foreground font-semibold">
                        {process.totalEmployees || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Monthly Payroll
                      </span>
                      <span className="text-card-foreground font-semibold">
                        ₹{(process.totalMonthlyPayroll || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        Active: <span className="text-emerald-600">{process.activeEmployees || 0}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Avg: ₹{Math.round(process.avgSalary || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/super-admin/processes/${process.id}`}
                    className="mt-4 block w-full py-2 bg-secondary hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600 rounded-xl text-sm font-semibold text-center border border-border hover:border-purple-500/50 transition-all"
                  >
                    View Details
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center">
                <Layers className="w-16 h-16 text-card-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Processes Found</h3>
                <p className="text-muted-foreground mb-4">Create your first process to get started</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground rounded-xl text-sm font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Process
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProcessModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </SuperAdminLayout>
  );
}
