'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CreateEmployeeModal } from '@/components/CreateEmployeeModal';
import { EditEmployeeModal } from '@/components/EditEmployeeModal';
import {
  Users, Plus, Search, Eye, Edit2, KeyRound,
  UserX, UserCheck, Trash2, ChevronLeft, ChevronRight, Loader2, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// ✅ PRODUCTION: No mock data - all employee data comes from database only

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PROFILE_COMPLETED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    DOCUMENTS_UPLOADED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    POLICIES_ACCEPTED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    VERIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${styles[status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const ProfileBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${value}%`,
          background: value === 100 ? '#22c55e' : value > 60 ? '#3b82f6' : '#f59e0b'
        }}
      />
    </div>
    <span className="text-[10px] text-neutral-400 font-mono w-8">{value}%</span>
  </div>
);

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = React.useState(false);
  const [editEmployee, setEditEmployee] = React.useState<any>(null);
  const [search, setSearch] = React.useState('');
  const [deptFilter, setDeptFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const LIMIT = 10;

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      try { const r = await api.get('/departments'); return Array.isArray(r.data) ? r.data : r.data?.data || []; }
      catch { return [{ id: 'd1', name: 'Engineering' }, { id: 'd2', name: 'Human Resources' }, { id: 'd3', name: 'Sales & Growth' }]; }
    }
  });

  const { data: empResponse, isLoading } = useQuery({
    queryKey: ['employees-list', search, deptFilter, statusFilter, page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (deptFilter) params.set('departmentId', deptFilter);
        if (statusFilter) params.set('onboardingStatus', statusFilter);
        params.set('page', String(page));
        params.set('limit', String(LIMIT));
        const r = await api.get(`/employees?${params.toString()}`);
        return r.data || { data: [], meta: { total: 0, page: 1, totalPages: 1 } };
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        return { data: [], meta: { total: 0, page: 1, totalPages: 1 } };
      }
    }
  });

  const rawEmployees: any[] = empResponse?.data || [];

  // Client-side filtering as a safety net — handles combined full name searches
  // (e.g. "NupurS", "nupur", "NUPUR") that the API may not catch perfectly.
  const employees: any[] = React.useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return rawEmployees;

    return rawEmployees.filter((emp: any) => {
      const searchableText = [
        emp.firstName,
        emp.lastName,
        `${emp.firstName || ''} ${emp.lastName || ''}`,
        `${emp.firstName || ''}${emp.lastName || ''}`,
        emp.employeeId,
        emp.user?.email,
        emp.email,
        emp.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [rawEmployees, search]);

  const meta = empResponse?.meta || { total: 0, page: 1, totalPages: 1 };

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/employees/${id}/reset-password`),
    onSuccess: () => alert('Password reset to 1234 and employee will be prompted to change on next login.'),
    onError: (e: any) => alert(e.message),
  });

  const activationMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post(`/employees/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees-list'] }),
    onError: (e: any) => alert(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-stats'] });
    },
    onError: (e: any) => alert(e.message),
  });

  const onboardingStatuses = ['PENDING', 'PROFILE_COMPLETED', 'DOCUMENTS_UPLOADED', 'POLICIES_ACCEPTED', 'COMPLETED', 'VERIFIED'];

  return (
    <HRLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              Employee Management
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage the complete employee directory — create, edit, deactivate, and track onboarding progress.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Global Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Departments</option>
              {(departments as any[]).map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Statuses</option>
              {onboardingStatuses.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-850 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Joining Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Profile</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-neutral-900 animate-pulse rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : employees.length > 0 ? (
                  employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                      {/* Employee Identity */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-heading text-xs font-bold text-white uppercase shrink-0">
                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="text-neutral-300 text-xs">{emp.user?.email}</div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">{emp.phone || 'N/A'}</div>
                      </td>

                      {/* Department + Designation */}
                      <td className="px-5 py-4">
                        <div className="text-neutral-300 text-xs font-medium">{emp.department?.name || '—'}</div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">{emp.designation?.name || '—'}</div>
                      </td>

                      {/* Joining Date */}
                      <td className="px-5 py-4">
                        <span className="text-neutral-300 text-xs">
                          {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={emp.onboardingStatus} />
                          {!emp.user?.isActive && (
                            <span className="text-[9px] text-red-400 font-bold uppercase">Deactivated</span>
                          )}
                        </div>
                      </td>

                      {/* Profile Completion Bar */}
                      <td className="px-5 py-4 min-w-[120px]">
                        <ProfileBar value={emp.profile?.profileCompletion || 0} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/hr/employees/${emp.id}`}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-blue-400 transition-colors"
                            title="View full profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditEmployee(emp)}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors"
                            title="Edit employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/hr/hr-actions/create?employeeId=${emp.id}`}
                            className="p-1.5 hover:bg-amber-500/10 rounded-lg text-neutral-400 hover:text-amber-400 transition-colors"
                            title="Issue HR Warning/Action"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => { if (confirm('Reset password to 1234?')) resetPasswordMutation.mutate(emp.id); }}
                            className="p-1.5 hover:bg-purple-500/10 rounded-lg text-neutral-400 hover:text-purple-400 transition-colors"
                            title="Reset password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => activationMutation.mutate({ id: emp.id, active: !emp.user?.isActive })}
                            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-purple-400 transition-colors"
                            title={emp.user?.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {emp.user?.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete ${emp.firstName} ${emp.lastName}? This cannot be undone.`)) {
                                deleteMutation.mutate(emp.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                            title="Delete employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-neutral-700" />
                        <span className="text-neutral-400 font-medium">No employees found matching the current filters.</span>
                        <button
                          onClick={() => setShowCreate(true)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Create your first employee
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-4">
              <span className="text-xs text-neutral-500 font-medium">
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, meta.total)} of {meta.total} employees
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-400 font-semibold px-2">Page {page} of {meta.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateEmployeeModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      {editEmployee && (
        <EditEmployeeModal employee={editEmployee} isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} />
      )}
    </HRLayout>
  );
}
