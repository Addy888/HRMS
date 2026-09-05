'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  MessageSquare,
  Loader2,
  ChevronLeft,
  AlertCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/toast';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles: Record<string, string> = {
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`text-xs font-bold uppercase tracking-wider border px-3 py-1 rounded ${styles[severity] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
    DRAFT: { bg: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', icon: <FileText className="w-4 h-4" /> },
    ISSUED: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <AlertCircle className="w-4 h-4" /> },
    VIEWED: { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <Eye className="w-4 h-4" /> },
    SENT: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <Clock className="w-4 h-4" /> },
    ACKNOWLEDGED: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
    RESPONSE_PENDING: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="w-4 h-4" /> },
    RESPONSE_SUBMITTED: { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
    RESOLVED: { bg: 'bg-green-500/10 text-green-400 border-green-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
    CANCELLED: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <XCircle className="w-4 h-4" /> },
  };

  const style = styles[status] || styles.DRAFT;

  return (
    <span className={`text-sm font-bold uppercase tracking-wider border px-3 py-1 rounded flex items-center gap-2 w-max ${style.bg}`}>
      {style.icon}
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default function EmployeeHRActionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const actionId = params.id as string;
  const [responseText, setResponseText] = React.useState('');

  const { data: action, isLoading, error } = useQuery({
    queryKey: ['hr-action', actionId],
    queryFn: async () => {
      const res = await api.get(`/hr-actions/${actionId}`);
      return res.data;
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/hr-actions/${actionId}/acknowledge`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('HR Action acknowledged successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-action', actionId] });
      queryClient.invalidateQueries({ queryKey: ['my-hr-actions'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to acknowledge HR Action');
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (responseText: string) => {
      const res = await api.post(`/hr-actions/${actionId}/respond`, {
        responseText,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Response submitted successfully');
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['hr-action', actionId] });
      queryClient.invalidateQueries({ queryKey: ['my-hr-actions'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit response');
    },
  });

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </EmployeeLayout>
    );
  }

  if (error || !action) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className="text-neutral-400">Failed to load HR action</p>
          <Link
            href="/employee/hr-actions"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to HR Actions
          </Link>
        </div>
      </EmployeeLayout>
    );
  }

  const canAcknowledge = ['ISSUED', 'VIEWED', 'SENT'].includes(action.status);
  const canRespond = action.responseRequired && ['RESPONSE_PENDING', 'ACKNOWLEDGED'].includes(action.status);
  const hasResponded = action.status === 'RESPONSE_SUBMITTED';

  return (
    <EmployeeLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/employee/hr-actions"
              className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to HR Actions
            </Link>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              HR Action Details
            </h1>
          </div>
        </div>

        {/* Action Number & Status */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="text-lg text-neutral-500 font-mono font-bold">
                {action.actionNumber}
              </span>
              <SeverityBadge severity={action.severity} />
              <StatusBadge status={action.status} />
            </div>
            <div className="text-sm text-neutral-400">
              Created: {new Date(action.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject & Type */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{action.subject}</h2>
              <p className="text-sm text-neutral-400 mb-4">
                {action.actionType.replace(/_/g, ' ')}
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Reason
                  </h3>
                  <p className="text-neutral-300 whitespace-pre-wrap">{action.reason}</p>
                </div>

                {action.correctiveAction && (
                  <div>
                    <h3 className="text-sm font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Corrective Action Required
                    </h3>
                    <p className="text-neutral-300 whitespace-pre-wrap">{action.correctiveAction}</p>
                  </div>
                )}

                {action.additionalRemarks && (
                  <div>
                    <h3 className="text-sm font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Additional Remarks
                    </h3>
                    <p className="text-neutral-300 whitespace-pre-wrap">{action.additionalRemarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Section */}
            {action.responseRequired && (
              <div className="bg-neutral-950 border border-amber-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  Response Required
                </h3>

                {canRespond ? (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-400">
                      Please provide your response to this HR action:
                    </p>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Enter your response..."
                      className="w-full h-32 bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={() => respondMutation.mutate(responseText)}
                      disabled={!responseText.trim() || respondMutation.isPending}
                      className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {respondMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submit Response
                        </>
                      )}
                    </button>
                  </div>
                ) : hasResponded ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-sm text-emerald-400 font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Response Submitted
                      </p>
                      <p className="text-sm text-neutral-400">
                        Submitted: {action.responseSubmittedAt && new Date(action.responseSubmittedAt).toLocaleString()}
                      </p>
                    </div>
                    {action.responseText && (
                      <div>
                        <h4 className="text-sm font-bold text-neutral-500 uppercase mb-2">Your Response:</h4>
                        <p className="text-neutral-300 whitespace-pre-wrap">{action.responseText}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">
                    {action.responseDeadline && (
                      <>Deadline: {new Date(action.responseDeadline).toLocaleDateString()}</>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Resolution Info */}
            {action.status === 'RESOLVED' && (
              <div className="bg-neutral-950 border border-green-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Resolution
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">
                    Resolved on: {action.resolvedAt && new Date(action.resolvedAt).toLocaleString()}
                  </p>
                  {action.resolvedBy && (
                    <p className="text-sm text-neutral-400">
                      Resolved by: {action.resolvedBy.employee?.firstName} {action.resolvedBy.employee?.lastName}
                    </p>
                  )}
                  {action.resolvedRemarks && (
                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-neutral-500 uppercase mb-2">Remarks:</h4>
                      <p className="text-neutral-300 whitespace-pre-wrap">{action.resolvedRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {action.status === 'CANCELLED' && (
              <div className="bg-neutral-950 border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Cancelled
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">
                    Cancelled on: {action.cancelledAt && new Date(action.cancelledAt).toLocaleString()}
                  </p>
                  {action.cancelledBy && (
                    <p className="text-sm text-neutral-400">
                      Cancelled by: {action.cancelledBy.employee?.firstName} {action.cancelledBy.employee?.lastName}
                    </p>
                  )}
                  {action.cancelledReason && (
                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-neutral-500 uppercase mb-2">Reason:</h4>
                      <p className="text-neutral-300 whitespace-pre-wrap">{action.cancelledReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Key Dates */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-neutral-500 uppercase mb-4">Key Dates</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-neutral-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-neutral-500">Incident Date</p>
                    <p className="text-white">{new Date(action.incidentDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {action.issuedAt && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Issued</p>
                      <p className="text-white">{new Date(action.issuedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {action.viewedAt && (
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Viewed</p>
                      <p className="text-white">{new Date(action.viewedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {action.acknowledgedAt && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Acknowledged</p>
                      <p className="text-white">{new Date(action.acknowledgedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Issued By */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-neutral-500 uppercase mb-4">Issued By</h3>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-neutral-500 mt-0.5" />
                <div className="text-sm">
                  {action.issuedBy?.employee ? (
                    <>
                      <p className="text-white">
                        {action.issuedBy.employee.firstName} {action.issuedBy.employee.lastName}
                      </p>
                      <p className="text-neutral-500">{action.issuedBy.email}</p>
                    </>
                  ) : (
                    <p className="text-neutral-400">HR Department</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {canAcknowledge && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-neutral-500 uppercase mb-4">Actions</h3>
                <button
                  onClick={() => acknowledgeMutation.mutate()}
                  disabled={acknowledgeMutation.isPending}
                  className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <p className="text-xs text-neutral-500 mt-2">
                  By acknowledging, you confirm that you have read and understood this HR action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
