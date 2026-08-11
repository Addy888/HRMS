'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  History, Search, Eye, Clock, User, FileText, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  MessageSquare, X, Calendar, Building
} from 'lucide-react';

const STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
  { value: 'ISSUED', label: 'Issued', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'SENT', label: 'Sent', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'VIEWED', label: 'Viewed', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'RESPONSE_PENDING', label: 'Response Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'RESPONSE_SUBMITTED', label: 'Response Submitted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' },
];

const ACTION_TYPES = [
  { value: 'LATE_LOGIN_WARNING', label: 'Late Login Warning' },
  { value: 'ATTENDANCE_WARNING', label: 'Attendance Warning' },
  { value: 'UNAUTHORIZED_ABSENCE', label: 'Unauthorized Absence' },
  { value: 'LEAVE_VIOLATION', label: 'Leave Violation' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
  { value: 'MISCONDUCT', label: 'Misconduct' },
  { value: 'PERFORMANCE_WARNING', label: 'Performance Warning' },
  { value: 'REPEATED_LATE_LOGIN', label: 'Repeated Late Login' },
  { value: 'SHOW_CAUSE_NOTICE', label: 'Show Cause Notice' },
  { value: 'FINAL_WARNING', label: 'Final Warning' },
  { value: 'GENERAL_WARNING', label: 'General Warning' },
  { value: 'CUSTOM_NOTICE', label: 'Custom HR Notice' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUSES.find(s => s.value === status);
  return (
    <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${config?.color || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'}`}>
      {config?.label || status}
    </span>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const config = SEVERITIES.find(s => s.value === severity);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-full ${config?.bg} ${config?.color || 'text-neutral-400'}`}>
      <AlertTriangle className="w-3 h-3" />
      {config?.label || severity}
    </span>
  );
};

export default function HRActionHistoryPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    actionType: '',
    employeeId: '',
  });
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const limit = 20;

  // Fetch HR actions with all history data
  const { data, isLoading } = useQuery({
    queryKey: ['hr-action-history', search, filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      
      const res = await api.get(`/hr-actions?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch single action details with timeline
  const { data: actionDetails } = useQuery({
    queryKey: ['hr-action-detail', selectedAction?.id],
    queryFn: async () => {
      if (!selectedAction?.id) return null;
      const res = await api.get(`/hr-actions/${selectedAction.id}`);
      return res.data;
    },
    enabled: !!selectedAction?.id,
  });

  const actions = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-blue-400" />
            HR Action History
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Complete audit trail of all HR actions issued, employee responses, and resolutions
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by action number, employee, or subject..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.actionType}
              onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
              className="px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {ACTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : actions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Action No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Created / Issued
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Response
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {actions.map((action: any) => (
                    <tr
                      key={action.id}
                      className="hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-blue-400">
                          {action.actionNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-500" />
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {action.employee?.firstName} {action.employee?.lastName}
                            </div>
                            <div className="text-xs text-neutral-500">{action.employee?.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-300">
                          {ACTION_TYPES.find(t => t.value === action.actionType)?.label || action.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeverityBadge severity={action.severity} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(action.createdAt).toLocaleDateString()}
                          </div>
                          {action.issuedAt && (
                            <div className="flex items-center gap-2 text-xs text-blue-400">
                              <Clock className="w-3 h-3" />
                              Issued: {new Date(action.issuedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={action.status} />
                      </td>
                      <td className="px-6 py-4">
                        {action.responseText ? (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold">Submitted</span>
                          </div>
                        ) : action.responseRequired ? (
                          <div className="flex items-center gap-2 text-amber-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-semibold">Pending</span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-600">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAction(action)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-20 text-center">
              <History className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No HR Action History</h3>
              <p className="text-sm text-neutral-500">
                {search || filters.status || filters.severity || filters.actionType
                  ? 'No actions match your search criteria'
                  : 'No HR actions have been created yet'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4 bg-neutral-950">
              <span className="text-sm text-neutral-400">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, meta.total)} of {meta.total} actions
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-black hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-white px-3">Page {page} of {meta.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg bg-black hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-neutral-800 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-7 h-7 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">HR Action Complete History</h2>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-lg font-bold text-blue-400">
                      {actionDetails?.actionNumber || selectedAction.actionNumber}
                    </span>
                    <StatusBadge status={actionDetails?.status || selectedAction.status} />
                    <SeverityBadge severity={actionDetails?.severity || selectedAction.severity} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Details */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Action Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 rounded-lg p-5 border border-neutral-800">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Employee</div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-500" />
                      <div>
                        <div className="text-white font-semibold">
                          {selectedAction.employee?.firstName} {selectedAction.employee?.lastName}
                        </div>
                        <div className="text-xs text-neutral-500">{selectedAction.employee?.employeeId}</div>
                      </div>
                    </div>
                  </div>

                  {selectedAction.employee?.department && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Department</div>
                      <div className="flex items-center gap-2 text-white">
                        <Building className="w-4 h-4 text-neutral-500" />
                        {selectedAction.employee.department.name}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Action Type</div>
                    <div className="text-white font-semibold">
                      {ACTION_TYPES.find(t => t.value === selectedAction.actionType)?.label || selectedAction.actionType}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Incident Date</div>
                    <div className="text-white">
                      {new Date(selectedAction.incidentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Created By</div>
                    <div className="text-white">
                      {actionDetails?.issuedBy?.employee 
                        ? `${actionDetails.issuedBy.employee.firstName} ${actionDetails.issuedBy.employee.lastName}`
                        : (actionDetails?.issuedBy?.email || selectedAction.issuedBy?.email || 'N/A')}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Created At</div>
                    <div className="text-white">
                      {new Date(selectedAction.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {selectedAction.issuedAt && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Issued At</div>
                      <div className="text-blue-400 font-semibold">
                        {new Date(selectedAction.issuedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}

                  {selectedAction.viewedAt && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Viewed At</div>
                      <div className="text-cyan-400">
                        {new Date(selectedAction.viewedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-xs text-neutral-500 mb-2 font-semibold uppercase">Subject</div>
                    <div className="text-white font-semibold text-lg">{selectedAction.subject}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500 mb-2 font-semibold uppercase">Reason / Description</div>
                    <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800 leading-relaxed">
                      {selectedAction.reason}
                    </div>
                  </div>

                  {selectedAction.correctiveAction && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-2 font-semibold uppercase">Required Corrective Action</div>
                      <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800 leading-relaxed">
                        {selectedAction.correctiveAction}
                      </div>
                    </div>
                  )}

                  {selectedAction.additionalRemarks && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-2 font-semibold uppercase">Additional Remarks</div>
                      <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800 leading-relaxed">
                        {selectedAction.additionalRemarks}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Response */}
              {selectedAction.responseRequired && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    Employee Response
                  </h3>
                  {selectedAction.responseText ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          Response Submitted
                        </div>
                        {selectedAction.responseSubmittedAt && (
                          <div className="text-sm text-neutral-400">
                            {new Date(selectedAction.responseSubmittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-emerald-500/20 leading-relaxed">
                        {selectedAction.responseText}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">Awaiting Employee Response</span>
                      </div>
                      {selectedAction.responseDeadline && (
                        <div className="text-sm text-neutral-400 mt-2">
                          Deadline: {new Date(selectedAction.responseDeadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Timeline */}
              {actionDetails?.auditLogs && actionDetails.auditLogs.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    Action Timeline
                  </h3>
                  <div className="space-y-3">
                    {actionDetails.auditLogs.map((log: any, index: number) => (
                      <div
                        key={log.id}
                        className="flex gap-4 bg-black/40 rounded-lg p-4 border border-neutral-800"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            {log.action === 'CREATED' || log.action === 'CREATED_AND_ISSUED' ? (
                              <FileText className="w-5 h-5 text-blue-400" />
                            ) : log.action === 'ISSUED' || log.action === 'SENT' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-400" />
                            ) : log.action === 'VIEWED' ? (
                              <Eye className="w-5 h-5 text-cyan-400" />
                            ) : log.action === 'ACKNOWLEDGED' ? (
                              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                            ) : log.action === 'RESPONSE_SUBMITTED' ? (
                              <MessageSquare className="w-5 h-5 text-emerald-400" />
                            ) : log.action === 'RESOLVED' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-white">{log.action.replace(/_/g, ' ')}</div>
                              <div className="text-sm text-neutral-400 mt-1">{log.details}</div>
                              {log.user && (
                                <div className="text-xs text-neutral-500 mt-2">
                                  By: {log.user.employee 
                                    ? `${log.user.employee.firstName} ${log.user.employee.lastName}`
                                    : log.user.email}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedAction.resolvedAt && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      Resolved
                    </div>
                    <div className="text-sm text-neutral-400">
                      {new Date(selectedAction.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                  {selectedAction.resolvedRemarks && (
                    <div className="text-neutral-300 bg-black/40 rounded-lg p-4 border border-green-500/20">
                      {selectedAction.resolvedRemarks}
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end border-t border-neutral-800 pt-6">
                <button
                  onClick={() => setSelectedAction(null)}
                  className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
