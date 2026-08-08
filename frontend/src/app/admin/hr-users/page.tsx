'use client';

import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  Power,
  PowerOff,
  Key,
  Loader2,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface HRAccount {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
}

export default function AdminHRUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HRAccount | null>(null);

  const { data: hrUsersData, isLoading } = useQuery({
    queryKey: ['admin-hr-users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await api.get(`/admin/hr-users?${params}`);
      return res.data?.data ?? res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/hr-users', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hr-users'] });
      setShowAddModal(false);
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || 'Failed to create HR account'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.patch(`/admin/hr-users/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hr-users'] });
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || 'Failed to update HR account'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/admin/hr-users/${id}/status`, { isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-hr-users'] }),
    onError: (err: any) =>
      alert(err.response?.data?.message || 'Failed to update status'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await api.post(`/admin/hr-users/${id}/reset-password`, { newPassword });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hr-users'] });
      setShowResetModal(false);
      setSelectedUser(null);
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || 'Failed to reset password'),
  });

  const hrUsers = Array.isArray(hrUsersData)
    ? hrUsersData
    : hrUsersData?.data ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-heading flex items-center gap-3">
              <UserCog className="w-7 h-7 text-purple-500" />
              HR Account Management
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Create and manage HR user accounts
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> Create HR Account
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : hrUsers.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
            <UserCog className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400">No HR accounts found</p>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-950 border-b border-neutral-800">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    HR Name
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    Mobile
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    Created
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-neutral-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {hrUsers.map((user: HRAccount) => (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-800 last:border-0 hover:bg-neutral-850 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm">
                          {user.employee?.firstName?.charAt(0)}
                          {user.employee?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {user.employee?.firstName} {user.employee?.lastName}
                          </p>
                          <p className="text-xs text-neutral-500 font-mono">
                            {user.employee?.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {user.employee?.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        HR
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-neutral-800 rounded-lg text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: user.id,
                              isActive: !user.isActive,
                            })
                          }
                          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? (
                            <PowerOff className="w-4 h-4 text-red-400" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetModal(true);
                          }}
                          className="p-2 hover:bg-neutral-800 rounded-lg text-amber-400 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAddModal && (
          <AddHRModal
            onClose={() => setShowAddModal(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        )}

        {showEditModal && selectedUser && (
          <EditHRModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSubmit={(data) =>
              updateMutation.mutate({ id: selectedUser.id, data })
            }
            isLoading={updateMutation.isPending}
          />
        )}

        {showResetModal && selectedUser && (
          <ResetPasswordModal
            user={selectedUser}
            onClose={() => {
              setShowResetModal(false);
              setSelectedUser(null);
            }}
            onSubmit={(newPassword) =>
              resetPasswordMutation.mutate({
                id: selectedUser.id,
                newPassword,
              })
            }
            isLoading={resetPasswordMutation.isPending}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Add HR Modal Component
function AddHRModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const err: any = {};
    if (!formData.firstName.trim()) err.firstName = 'First name is required';
    if (!formData.lastName.trim()) err.lastName = 'Last name is required';
    if (!formData.email.trim()) err.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      err.email = 'Invalid email format';
    if (!formData.password) err.password = 'Password is required';
    else if (formData.password.length < 8)
      err.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      err.confirmPassword = 'Passwords do not match';
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone))
      err.phone = 'Mobile must be 10 digits';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        isActive: formData.isActive,
      };
      onSubmit(payload);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-500" />
            Create HR Account
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                First Name *
              </label>
              <input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                  errors.firstName ? 'border-red-500' : 'border-neutral-800'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Last Name *
              </label>
              <input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                  errors.lastName ? 'border-red-500' : 'border-neutral-800'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                errors.email ? 'border-red-500' : 'border-neutral-800'
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="john.doe@company.com"
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                    errors.password ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-neutral-800'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Mobile Number
            </label>
            <input
              value={formData.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                })
              }
              className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                errors.phone ? 'border-red-500' : 'border-neutral-800'
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="9876543210"
            />
            {errors.phone && (
              <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="flex items-center gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded accent-purple-500"
            />
            <label className="text-sm text-neutral-300">
              Active Status (HR can login immediately)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-white font-semibold transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Create HR Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit HR Modal
function EditHRModal({
  user,
  onClose,
  onSubmit,
  isLoading,
}: {
  user: HRAccount;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: user.employee?.firstName || '',
    lastName: user.employee?.lastName || '',
    phone: user.employee?.phone || '',
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const err: any = {};
    if (!formData.firstName.trim()) err.firstName = 'First name is required';
    if (!formData.lastName.trim()) err.lastName = 'Last name is required';
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone))
      err.phone = 'Mobile must be 10 digits';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-purple-500" />
            Edit HR Account
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <p className="text-sm text-neutral-400">
              Email: <span className="text-white font-semibold">{user.email}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Employee ID: {user.employee?.employeeId}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                First Name *
              </label>
              <input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                  errors.firstName ? 'border-red-500' : 'border-neutral-800'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Last Name *
              </label>
              <input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                  errors.lastName ? 'border-red-500' : 'border-neutral-800'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.lastName && (
                <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Mobile Number
            </label>
            <input
              value={formData.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                })
              }
              className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                errors.phone ? 'border-red-500' : 'border-neutral-800'
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            {errors.phone && (
              <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-white font-semibold transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Update HR Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reset Password Modal
function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
  isLoading,
}: {
  user: HRAccount;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
  isLoading: boolean;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const err: any = {};
    if (!newPassword) err.newPassword = 'Password is required';
    else if (newPassword.length < 8)
      err.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword)
      err.confirmPassword = 'Passwords do not match';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(newPassword);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            Reset Password
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-semibold mb-1">Resetting password for:</p>
                <p className="text-amber-300/80">{user.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                  errors.newPassword ? 'border-red-500' : 'border-neutral-800'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-400 mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2.5 bg-neutral-950 border ${
                errors.confirmPassword ? 'border-red-500' : 'border-neutral-800'
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-white font-semibold transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Resetting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Reset Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
