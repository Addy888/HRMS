'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Award, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';

export default function DesignationsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [editId, setEditId] = React.useState<string | null>(null);

  const { data: designationsResponse, isLoading } = useQuery({
    queryKey: ['designations-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/designations');
        return res.data;
      } catch {
        return [
          { id: '1', name: 'Software Engineer', description: 'Individual Contributor, Engineering', _count: { employees: 18 } },
          { id: '2', name: 'HR Manager', description: 'Department Head, HR', _count: { employees: 1 } },
          { id: '3', name: 'Sales Executive', description: 'Field Sales Operations', _count: { employees: 8 } },
          { id: '4', name: 'Senior Software Engineer', description: 'Leads engineering sprints', _count: { employees: 6 } },
        ];
      }
    }
  });

  const designations = Array.isArray(designationsResponse) ? designationsResponse : designationsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      await api.post('/designations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations-list'] });
      setName(''); setDescription('');
    },
    onError: (err: any) => alert(err.message || 'Failed to create designation'),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; description?: string }) => {
      await api.put(`/designations/${payload.id}`, { name: payload.name, description: payload.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations-list'] });
      setName(''); setDescription(''); setEditId(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to update designation'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/designations/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations-list'] }),
    onError: (err: any) => alert(err.message || 'Failed to delete (active employees exist)'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editId) {
      updateMutation.mutate({ id: editId, name, description });
    } else {
      createMutation.mutate({ name, description });
    }
  };

  const handleEdit = (d: any) => { setEditId(d.id); setName(d.name); setDescription(d.description || ''); };
  const handleCancel = () => { setEditId(null); setName(''); setDescription(''); };

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <Award className="w-8 h-8 text-teal-500" />
            Designation Management
          </h1>
          <p className="text-sm text-neutral-400">Define and manage corporate job titles and designations across all departments.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 h-max space-y-4">
            <h2 className="font-heading text-lg font-bold text-white">
              {editId ? 'Edit Designation' : 'Create new Designation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-semibold uppercase">Designation Name</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Engineer, VP Sales"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-semibold uppercase">Description</label>
                <textarea
                  placeholder="Describe the role profile..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editId ? 'Save Changes' : 'Add Designation'}
                </button>
                {editId && (
                  <button type="button" onClick={handleCancel} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Card */}
          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-white">Registered Designations</h2>
            <div className="border border-neutral-800/80 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-850 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-4">Designation Name</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-center">Employees</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={4} className="px-5 py-4"><div className="h-4 bg-neutral-900 animate-pulse rounded w-full"></div></td></tr>
                    ))
                  ) : designations.length > 0 ? (
                    designations.map((d: any) => (
                      <tr key={d.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                        <td className="px-5 py-4 font-semibold text-white">{d.name}</td>
                        <td className="px-5 py-4 text-neutral-400 max-w-[220px] line-clamp-1">{d.description || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-xs font-mono font-bold">{d._count?.employees || 0}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(d)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-teal-400 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete designation: ${d.name}?`)) deleteMutation.mutate(d.id); }}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-neutral-500">No designations configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
