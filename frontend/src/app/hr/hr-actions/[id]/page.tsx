'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import HRLayout from '@/layouts/HRLayout';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowLeft, Send, CheckCircle2, XCircle,
  Calendar, User, Building, Mail, Phone, FileText, Clock,
  MessageSquare, Loader2, Ban
} from 'lucide-react';
import { toast } from '@/lib/toast';

const STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-neutral-500/10 text-neutral-400' },
  { value: 'ISSUED', label: 'Issued', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'SENT', label: 'Sent', color: 'bg-purple-500/10 text-purple-400' },
  { value: 'VIEWED', label: 'Viewed', color: 'bg-cyan-500/10 text-cyan-400' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged', color: 'bg-indigo-500/10 text-indigo-400' },
  { value: 'RESPONSE_PENDING', label: 'Response Pending', color: 'bg-amber-500/10 text-amber-400' },
  { value: 'RESPONSE_SUBMITTED', label: 'Response Submitted', color: 'bg-emerald-500/10 text-emerald-400' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-500/10 text-green-400' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500/10 text-red-400' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'text-blue-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-400' },
  { value: 'HIGH', label: 'High', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-400' },
];

export default function HRActionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const actionId = params.id as string;

  const [resolveRemarks, setResolveRemarks] = React.useState('');
  const [cancelReason, setCancelReason] = React.useState('');
  const [showResolveModal, setShowResolveModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);

  // Fetch HR Action details
  const { data: action, isLoading } = useQuery({
    queryKey: ['hr-action', actionId],
    queryFn: async () => {
      const res = await api.get(`/hr-actions/${actionId}`);
      return res.data;
    },
  });

  // Issue mutation
  const issueMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/hr-actions/${actionId}/issue`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('HR Action issued successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-action', actionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to issue HR Action');
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/hr-actions/${actionId}/send`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('HR Action sent to employee');
      queryClient.invalidateQueries({ queryKey: ['hr-action', actionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send HR Action');
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async (data: { resolvedRemarks: string }) => {
      const res = await api.post(`/hr-actions/${actionId}/resolve`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('HR Action resolved');
      setShowResolveModal(false);
      setResolveRemarks('');
      queryClient.invalidateQueries({ queryKey: ['hr-action', actionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve HR Action');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (data: { cancelledReason: string }) => {
      const res = await api.post(`/hr-actions/${actionId}/cancel`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('HR Action cancelled');
      setShowCancelModal(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['hr-action', actionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel HR Action');
    },
  });

  if (isLoading) {
    return (
      <HRLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </HRLayout>
    );
  }

  if (!action) {
    return (
      <HRLayout>
        <div className="text-center py-16">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">HR Action Not Found</h2>
          <button
            onClick={() => router.push('/hr/hr-actions')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to HR Actions
          </button>
        </div>
      </HRLayout>
    );
  }

  const statusConfig = STATUSES.find(s => s.value === action.status);
  const severityConfig = SEVERITIES.find(s => s.value === action.severity);

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
                HR Action Details
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                {action.actionNumber}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {action.status === 'DRAFT' && (
              <button
                onClick={() => issueMutation.mutate()}
                disabled={issueMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {issueMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send HR Action
              </button>
            )}

            {action.status !== 'RESOLVED' && action.status !== 'CANCELLED' && action.status !== 'DRAFT' && (
              <>
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Resolve
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Employee & Status */}
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Employee Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-bold text-white uppercase">
                    {action.employee?.firstName?.charAt(0)}{action.employee?.lastName?.charAt(0)}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Name</div>
                    <div className="font-semibold text-white">
                      {action.employee?.firstName} {action.employee?.lastName}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Employee ID</div>
                    <div className="font-mono text-neutral-300">{action.employee?.employeeId}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                    <div className="text-neutral-300">{action.employee?.user?.email}</div>
                  </div>
                  
                  {action.employee?.phone && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </div>
                      <div className="text-neutral-300">{action.employee?.phone}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Department
                    </div>
                    <div className="text-neutral-300">{action.employee?.department?.name || '—'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Designation</div>
                    <div className="text-neutral-300">{action.employee?.designation?.name || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Status Timeline</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Current Status</span>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${statusConfig?.color}`}>
                    {statusConfig?.label}
                  </span>
                </div>

                {action.issuedAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Issued At</div>
                    <div className="text-neutral-300">
                      {new Date(action.issuedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {action.sentAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Sent At</div>
                    <div className="text-neutral-300">
                      {new Date(action.sentAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {action.viewedAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Viewed At</div>
                    <div className="text-neutral-300">
                      {new Date(action.viewedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {action.acknowledgedAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Acknowledged At</div>
                    <div className="text-neutral-300">
                      {new Date(action.acknowledgedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {action.responseSubmittedAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Response Submitted At</div>
                    <div className="text-neutral-300">
                      {new Date(action.responseSubmittedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {action.resolvedAt && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Resolved At</div>
                    <div className="text-neutral-300">
                      {new Date(action.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Action Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Details */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Action Details</h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Action Type</div>
                    <div className="font-semibold text-white">
                      {action.actionType?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Severity</div>
                    <span className={`text-sm font-bold ${severityConfig?.color}`}>
                      {severityConfig?.label}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Incident Date
                  </div>
                  <div className="text-white">
                    {new Date(action.incidentDate).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-2">Subject</div>
                  <div className="text-white font-semibold">{action.subject}</div>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-2">Reason / Description</div>
                  <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800">
                    {action.reason}
                  </div>
                </div>

                {action.correctiveAction && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-2">Required Corrective Action</div>
                    <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800">
                      {action.correctiveAction}
                    </div>
                  </div>
                )}

                {action.additionalRemarks && (
                  <div>
                    <div className="text-xs text-neutral-500 mb-2">Additional Remarks</div>
                    <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800">
                      {action.additionalRemarks}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Response Required</div>
                    <div className={`font-semibold ${action.responseRequired ? 'text-amber-400' : 'text-neutral-400'}`}>
                      {action.responseRequired ? 'Yes' : 'No'}
                    </div>
                  </div>
                  
                  {action.responseRequired && action.responseDeadline && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Response Deadline
                      </div>
                      <div className="text-amber-400 font-semibold">
                        {new Date(action.responseDeadline).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Response */}
            {action.responseText && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Employee Response
                </h3>
                <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800">
                  {action.responseText}
                </div>
              </div>
            )}

            {/* Resolution Details */}
            {action.resolvedRemarks && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Resolution Details
                </h3>
                <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800">
                  {action.resolvedRemarks}
                </div>
              </div>
            )}

            {/* Cancellation Details */}
            {action.cancelledReason && (
              <div className="bg-neutral-900 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  Cancellation Reason
                </h3>
                <div className="text-neutral-300 whitespace-pre-wrap bg-black/40 rounded-lg p-4 border border-neutral-800">
                  {action.cancelledReason}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4">Resolve HR Action</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Resolution Remarks <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolveRemarks}
                  onChange={(e) => setResolveRemarks(e.target.value)}
                  placeholder="Enter resolution details..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ resolvedRemarks: resolveRemarks })}
                  disabled={!resolveRemarks.trim() || resolveMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {resolveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4">Cancel HR Action</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Cancellation Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => cancelMutation.mutate({ cancelledReason: cancelReason })}
                  disabled={!cancelReason.trim() || cancelMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      Cancel Action
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
