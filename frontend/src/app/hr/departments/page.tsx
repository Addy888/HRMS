'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Layers, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [editId, setEditId] = React.useState<string | null>(null);

  // Fetch Departments
  const { data: departmentsResponse, isLoading } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/departments');
        return res.data;
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        return []; // ✅ PRODUCTION: Return empty array, no mock data
      }
    }
  });

  const departments = Array.isArray(departmentsResponse) ? departmentsResponse : departmentsResponse?.data || [];

  // Create Department Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      await api.post('/departments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      setName('');
      setDescription('');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create department');
    }
  });

  // Update Department Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; description?: string }) => {
      await api.put(`/departments/${payload.id}`, { name: payload.name, description: payload.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      setName('');
      setDescription('');
      setEditId(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update department');
    }
  });

  // Delete Department Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete department (Cannot delete if active employees exist)');
    }
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

  const handleEditClick = (dept: any) => {
    setEditId(dept.id);
    setName(dept.name);
    setDescription(dept.description || '');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setName('');
    setDescription('');
  };

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-500" />
            Department Management
          </h1>
          <p className="text-sm text-neutral-400">
            Define corporate divisions, configure descriptions, and track employee headcounts per department.
          </p>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Action Form Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 h-max space-y-4">
            <h2 className="font-heading text-lg font-bold text-white">
              {editId ? 'Edit Department details' : 'Create new Department'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-semibold uppercase">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Finance, Support"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-semibold uppercase">Description</label>
                <textarea
                  placeholder="Describe the department responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editId ? 'Save changes' : 'Add Department'}
                </button>
                
                {editId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Table Card */}
          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-white">Registered Departments</h2>
            
            <div className="border border-neutral-800/80 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-850 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-4">Department Name</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-center">Employees</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx}>
                        <td colSpan={4} className="px-5 py-4 animate-pulse"><div className="h-4 bg-neutral-900 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : departments.length > 0 ? (
                    departments.map((dept: any) => (
                      <tr key={dept.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                        <td className="px-5 py-4 font-semibold text-white">{dept.name}</td>
                        <td className="px-5 py-4 text-neutral-400 line-clamp-1 max-w-[220px]">{dept.description || 'No description provided'}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-xs font-mono font-bold">
                            {dept._count?.employees || 0}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(dept)}
                              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-blue-400 transition-colors"
                              title="Edit department details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete department: ${dept.name}?`)) {
                                  deleteMutation.mutate(dept.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                              title="Delete department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-neutral-500">No departments configured in HRMS.</td>
                    </tr>
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
