'use client';

import React, { useState } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FileWarning, Eye, CheckCircle2, MessageSquare, AlertTriangle,
  Calendar, Clock, FileText, Loader2, Search, Filter, X
} from 'lucide-react';
import { toast } from '@/lib/toast';

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

const STATUSES = [
  { value: 'ISSUED', label: 'Issued', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
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

export default function EmployeeHRActionsPage() {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch employee's HR actions using the secure endpoint
  const { data: actionsData, isLoading, error } = useQuery({
    queryKey: ['employee-hr-actions'],
    queryFn: async () => {
      console.log('[HR ACTIONS] Requesting employee actions...');
      const res = await api.get('/hr-actions/my-actions');
      console.log('[HR ACTIONS] API response:', res.data);
      console.log('[HR ACTIONS] Response type:', typeof res.data);
      console.log('[HR ACTIONS] Response keys:', res.data ? Object.keys(res.data) : 'null');
      
      // Handle API envelope structure
      if (res.data && typeof res.data === 'object') {
        // If backend returns { success, data, message } envelope
        if ('data' in res.data) {
          console.log('[HR ACTIONS] Envelope detected, extracting data property');
          console.log('[HR ACTIONS] Extracted data:', res.data.data);
          console.log('[HR ACTIONS] Extracted data is array?', Array.isArray(res.data.data));
          console.log('[HR ACTIONS] Extracted data length:', Array.isArray(res.data.data) ? res.data.data.length : 'N/A');
          return res.data.data; // Extract the actual array from envelope
        }
        // If backend returns array directly
        if (Array.isArray(res.data)) {
          console.log('[HR ACTIONS] Direct array response');
          console.log('[HR ACTIONS] Array length:', res.data.length);
          return res.data;
        }
      }
      
      console.log('[HR ACTIONS] Unexpected response format, returning empty array');
      return [];
    },
  });

  // Debug logging
  console.log('[HR ACTIONS] actionsData:', actionsData);
  console.log('[HR ACTIONS] isLoading:', isLoading);
  console.log('[HR ACTIONS] error:', error);

  // Show error toast if query failed
  React.useEffect(() => {
    if (error) {
      console.error('[HR ACTIONS] Query error:', error);
      toast.error('Failed to load HR Actions');
    }
  }, [error]);

  // Ensure actions is always an array
  const actions = Array.isArray(actionsData) ? actionsData : [];
  console.log('[HR ACTIONS] Final actions array:', actions);
  console.log('[HR ACTIONS] Final actions length:', actions.length);

  // View action mutation - marks action as viewed when opened
  const viewActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await api.post(`/hr-actions/${actionId}/mark-viewed`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-hr-actions'] });
      if (selectedAction) {
        setSelectedAction((prev: any) => ({
          ...prev,
          status: 'VIEWED',
          viewedAt: new Date().toISOString(),
        }));
      }
    },
    onError: (error: any) => {
      console.error('Failed to mark as viewed:', error);
    },
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await api.post(`/hr-actions/${actionId}/acknowledge`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('HR Action acknowledged successfully');
      queryClient.invalidateQueries({ queryKey: ['employee-hr-actions'] });
      if (selectedAction) {
        setSelectedAction((prev: any) => ({
          ...prev,
          status: prev.responseRequired ? 'RESPONSE_PENDING' : 'ACKNOWLEDGED',
          acknowledgedAt: new Date().toISOString(),
        }));
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge HR Action');
    },
  });

  // Respond mutation
  const respondMutation = useMutation({
    mutationFn: async ({ actionId, responseText }: { actionId: string; responseText: string }) => {
      const res = await api.post(`/hr-actions/${actionId}/respond`, { responseText });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Response submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['employee-hr-actions'] });
      setSelectedAction(null);
      setResponseText('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    },
  });

  // Filter actions
  const filteredActions = actions.filter((action: any) => {
    const matchesSearch = !searchQuery || 
      action.actionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || action.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || action.actionType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const hrActions = filteredActions;

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileWarning className="w-8 h-8 text-amber-400" />
            HR Actions
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            View warnings, notices and official HR actions issued to you
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by action number or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {(statusFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Filters</h3>
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  {STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Action Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Types</option>
                  {ACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* HR Actions Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : hrActions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Action No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {hrActions.map((action: any) => (
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
                        <span className="text-sm text-neutral-300">
                          {ACTION_TYPES.find(t => t.value === action.actionType)?.label || action.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-white">
                          {action.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeverityBadge severity={action.severity} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(action.incidentDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={action.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedAction(action);
                            // Mark as viewed if status is ISSUED
                            if (action.status === 'ISSUED') {
                              viewActionMutation.mutate(action.id);
                            }
                          }}
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
              <FileWarning className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No HR Actions</h3>
              <p className="text-sm text-neutral-500">
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'No HR actions match your search criteria'
                  : 'No HR actions have been issued to you'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-neutral-800 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <FileWarning className="w-7 h-7 text-amber-400" />
                    <h2 className="text-2xl font-bold text-white">HR Action Details</h2>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-lg font-bold text-blue-400">
                      {selectedAction.actionNumber}
                    </span>
                    <StatusBadge status={selectedAction.status} />
                    <SeverityBadge severity={selectedAction.severity} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setResponseText('');
                  }}
                  className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {selectedAction.sentAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Issued Date</div>
                    <div className="text-white">
                      {new Date(selectedAction.sentAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {selectedAction.issuedBy && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Issued By</div>
                    <div className="text-white">
                      {selectedAction.issuedBy.employee 
                        ? `${selectedAction.issuedBy.employee.firstName} ${selectedAction.issuedBy.employee.lastName}`
                        : selectedAction.issuedBy.email}
                    </div>
                  </div>
                )}
              </div>

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

              {selectedAction.responseRequired && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold">Response Required</span>
                  </div>
                  {selectedAction.responseDeadline && (
                    <div className="text-sm text-neutral-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Deadline: {new Date(selectedAction.responseDeadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Acknowledgement Status */}
              {selectedAction.acknowledgedAt && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">✓ Acknowledged</span>
                    <span className="text-sm text-neutral-400">
                      on {new Date(selectedAction.acknowledgedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Response Section */}
              {selectedAction.responseRequired && 
               (selectedAction.status === 'ACKNOWLEDGED' || selectedAction.status === 'RESPONSE_PENDING') && (
                <div className="border-t border-neutral-800 pt-6">
                  <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Submit Your Response
                  </div>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response here..."
                    rows={6}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedAction.responseText && (
                <div>
                  <div className="text-xs text-neutral-500 mb-2 font-semibold uppercase flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Your Response
                  </div>
                  <div className="text-neutral-300 whitespace-pre-wrap bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20 leading-relaxed">
                    {selectedAction.responseText}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-neutral-800 pt-6">
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setResponseText('');
                  }}
                  className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Close
                </button>

                {(selectedAction.status === 'ISSUED' || selectedAction.status === 'VIEWED') && (
                  <button
                    onClick={() => acknowledgeMutation.mutate(selectedAction.id)}
                    disabled={acknowledgeMutation.isPending}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-semibold"
                  >
                    {acknowledgeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Acknowledging...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Acknowledge
                      </>
                    )}
                  </button>
                )}

                {selectedAction.responseRequired && 
                 (selectedAction.status === 'ACKNOWLEDGED' || selectedAction.status === 'RESPONSE_PENDING') && (
                  <button
                    onClick={() => respondMutation.mutate({ 
                      actionId: selectedAction.id, 
                      responseText 
                    })}
                    disabled={!responseText.trim() || respondMutation.isPending}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-semibold"
                  >
                    {respondMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Submit Response
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}
