'use client';

import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  Loader2,
  Shield,
  X,
} from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAdminModal = ({ isOpen, onClose }: CreateAdminModalProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '123456',
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      await api.post('/super-admin/admins', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-admins'] });
      onClose();
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '123456',
        isActive: true,
      });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to create admin'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <h2 className="font-heading text-xl font-bold text-white">Create HR Admin</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
              First Name
            </label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
              Default Password
            </label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1">Admin will be prompted to change on first login</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-neutral-300">
              Active (allow login)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {createMutation.isPending ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const { data: admins, isLoading } = useQuery({
    queryKey: ['super-admin-admins'],
    queryFn: async () => {
      const res = await api.get('/super-admin/admins');
      return res.data.data || res.data;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/super-admin/admins/${id}/reset-password`),
    onSuccess: (res) => {
      alert(`Password reset to: ${res.data.defaultPassword}`);
    },
    onError: (e: any) => alert(e.response?.data?.message || 'Failed to reset password'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-admins'] });
    },
    onError: (e: any) => alert(e.response?.data?.message || 'Failed to delete admin'),
  });

  const filteredAdmins = React.useMemo(() => {
    if (!admins) return [];
    if (!search) return admins;
    
    return admins.filter((admin: any) =>
      admin.email.toLowerCase().includes(search.toLowerCase()) ||
      admin.firstName.toLowerCase().includes(search.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(search.toLowerCase())
    );
  }, [admins, search]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <UserCog className="w-8 h-8 text-purple-500" />
              Admin Management
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage HR admins who handle employee operations
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>

        {/* Search */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Admin Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-4">Admin</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Employees Managed</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-neutral-900 animate-pulse rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin: any) => (
                    <tr key={admin.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-heading text-xs font-bold text-white uppercase">
                            {admin.firstName?.charAt(0)}{admin.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{admin.firstName} {admin.lastName}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">ID: {admin.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-neutral-300 text-xs">{admin.email}</div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">{admin.phone || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {admin.roleDisplay || admin.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-neutral-300 text-sm">{admin.employeesManaged || 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        {admin.isActive ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => {
                              if (confirm('Reset password to 123456?')) {
                                resetPasswordMutation.mutate(admin.id);
                              }
                            }}
                            className="p-1.5 hover:bg-purple-500/10 rounded-lg text-neutral-400 hover:text-purple-400 transition-colors"
                            title="Reset password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete admin ${admin.email}?`)) {
                                deleteMutation.mutate(admin.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                            title="Delete admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserCog className="w-12 h-12 text-neutral-700" />
                        <span className="text-neutral-400 font-medium">No admins found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateAdminModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </SuperAdminLayout>
  );
}
