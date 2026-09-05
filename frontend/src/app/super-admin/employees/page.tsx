'use client';

import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  Loader2,
  Eye,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminEmployeesPage() {
  const [search, setSearch] = React.useState('');
  const [processFilter, setProcessFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['super-admin-employees', search, processFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (processFilter) params.set('departmentId', processFilter);
      if (statusFilter) params.set('isActive', statusFilter);
      
      const res = await api.get(`/super-admin/employees?${params.toString()}`);
      return res.data.data || res.data;
    },
  });

  const { data: processes, isLoading: processesLoading } = useQuery({
    queryKey: ['super-admin-processes-list'],
    queryFn: async () => {
      const res = await api.get('/super-admin/processes');
      return res.data.data || res.data;
    },
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            Employee Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            View and manage all employees across the company
          </p>
        </div>

        {/* Filters */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Process Filter */}
            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              disabled={processesLoading}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            >
              <option value="">All Processes</option>
              {Array.isArray(processes) && processes.map((process: any) => (
                <option key={process.id} value={process.id}>{process.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Process</th>
                  <th className="px-5 py-4">Designation</th>
                  <th className="px-5 py-4">Salary</th>
                  <th className="px-5 py-4">Status</th>
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
                ) : employees && Array.isArray(employees) && employees.length > 0 ? (
                  employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-heading text-xs font-bold text-white uppercase">
                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{emp.fullName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-neutral-300 text-xs">{emp.email}</div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">{emp.phone || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-neutral-300 text-xs">{emp.departmentName || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-neutral-300 text-xs">{emp.designationTitle || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white text-sm font-semibold">
                          ₹{(emp.totalSalary || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">per month</div>
                      </td>
                      <td className="px-5 py-4">
                        {emp.isActive ? (
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
                          <Link
                            href={`/super-admin/employees/${emp.id}`}
                            className="p-1.5 hover:bg-purple-500/10 rounded-lg text-neutral-400 hover:text-purple-400 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-neutral-700" />
                        <span className="text-neutral-400 font-medium">No employees found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
