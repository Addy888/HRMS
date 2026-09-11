'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, RefreshCw, History, User, Clock, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import HRLayout from '@/layouts/HRLayout';
import api from '@/lib/api';

interface HistoryChange {
  old: any;
  new: any;
}

interface HistoryRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  updatedByUserId: string;
  updatedByName: string;
  updatedByRole: string;
  reason: string;
  changes: Record<string, HistoryChange>;
  createdAt: string;
}

interface HistoryResponse {
  data: HistoryRecord[];
  total: number;
}

export default function EmployeeUpdateHistoryPage() {
  const [search, setSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [role, setRole] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  // Fetch global update history
  const { data, isLoading, isError, refetch } = useQuery<HistoryResponse>({
    queryKey: ['employee-update-history', { search, employeeId, updatedBy, role, startDate, endDate }],
    queryFn: async () => {
      console.log('[EMPLOYEE-UPDATE-HISTORY] Fetching history with filters:', {
        search,
        employeeId,
        updatedBy,
        role,
        startDate,
        endDate,
      });

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (employeeId) params.append('employeeId', employeeId);
      if (updatedBy) params.append('updatedBy', updatedBy);
      if (role && role !== 'all') params.append('role', role);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      console.log('[EMPLOYEE-UPDATE-HISTORY] API URL:', `/employees/update-history/all?${params.toString()}`);

      const response = await api.get(`/employees/update-history/all?${params.toString()}`);
      
      console.log('[EMPLOYEE-UPDATE-HISTORY] API response:', response);
      console.log('[EMPLOYEE-UPDATE-HISTORY] Response data:', response.data);
      console.log('[EMPLOYEE-UPDATE-HISTORY] Records count:', response.data?.data?.length || 0);

      return response.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Debug: Log when data changes
  React.useEffect(() => {
    if (data) {
      console.log('[EMPLOYEE-UPDATE-HISTORY] Data received:', data);
      console.log('[EMPLOYEE-UPDATE-HISTORY] Total records:', data.total);
      console.log('[EMPLOYEE-UPDATE-HISTORY] Data array length:', data.data?.length);
    }
  }, [data]);

  const handleClearFilters = () => {
    setSearch('');
    setEmployeeId('');
    setUpdatedBy('');
    setRole('all');
    setStartDate('');
    setEndDate('');
  };

  const toggleExpanded = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const formatFieldName = (fieldName: string): string => {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not Set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'string' && value.length === 0) return 'Empty';
    return String(value);
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (role === 'HR' || role === 'HR_ADMIN' || role === 'HR_USER') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'SUPER ADMIN';
    if (role === 'HR_ADMIN') return 'HR ADMIN';
    if (role === 'HR_USER') return 'HR USER';
    if (role === 'HR') return 'HR';
    return role;
  };

  return (
    <HRLayout>
      <div className="space-y-6 bg-gray-50 -m-6 md:-m-10 p-6 md:p-10 min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <History className="w-8 h-8 text-purple-600" />
              Employee Update History
            </h1>
            <p className="text-gray-600 mt-2">
              Track employee profile changes, who made them, when they were made, and why.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>

        {/* Filters Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Employee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Employee name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="FCS0014..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Updated By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Updated By
              </label>
              <input
                type="text"
                value={updatedBy}
                onChange={(e) => setUpdatedBy(e.target.value)}
                placeholder="Updater name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Roles</option>
                <option value="hr">HR</option>
                <option value="super_admin">SUPER ADMIN</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <button
              onClick={handleClearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {data && (
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{data.total}</span> update records
          </div>
        )}

        {/* History Records */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">Failed to load update history. Please try again.</p>
            </div>
          )}

          {data && data.data.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-1">No employee updates found</p>
              <p className="text-gray-500">There are no employee update records matching your filters.</p>
            </div>
          )}

          {data && data.data.map((record) => {
            const isExpanded = expandedRecords.has(record.id);
            const changeCount = Object.keys(record.changes).length;

            return (
              <div
                key={record.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <User className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {record.employeeName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {record.employeeCode}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(record.updatedByRole)}`}>
                      {getRoleLabel(record.updatedByRole)}
                    </span>
                  </div>

                  {/* Updated By and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Updated by:</span>
                      <span className="font-semibold text-gray-900">{record.updatedByName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{format(new Date(record.createdAt), 'dd MMM yyyy • hh:mm a')}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                          Reason for Update
                        </p>
                        <p className="text-sm text-amber-900">{record.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Changes Summary */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      {changeCount} field{changeCount !== 1 ? 's' : ''} changed
                    </p>
                    <button
                      onClick={() => toggleExpanded(record.id)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Changes' : 'View Changes'}
                      <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Changes */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Changes</p>
                      {Object.entries(record.changes).map(([fieldName, change]) => (
                        <div key={fieldName} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">
                            {formatFieldName(fieldName)}
                          </p>
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="px-3 py-1 bg-red-50 text-red-700 rounded border border-red-200 font-medium">
                              {formatValue(change.old)}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded border border-green-200 font-medium">
                              {formatValue(change.new)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </HRLayout>
  );
}
