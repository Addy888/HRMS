'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/layouts/HRLayout';
import {
  ArrowLeft,
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Paperclip,
  Download,
  AlertCircle,
  Loader2,
  Send,
  Building,
  Shield,
  HelpCircle,
  EyeOff,
  UserPlus
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  HR_ISSUE: 'HR Issue',
  SALARY_ISSUE: 'Salary Issue',
  ATTENDANCE: 'Attendance',
  LEAVE: 'Leave',
  MANAGER: 'Manager Relationship',
  IT_SUPPORT: 'IT Support',
  PAYROLL: 'Payroll Query',
  DOCUMENT_VERIFICATION: 'Documents',
  WORK_ENVIRONMENT: 'Work Environment',
  HARASSMENT: 'Harassment',
  POSH: 'POSH Policy Issue',
  ASSET_ISSUE: 'Asset Allocation',
  SYSTEM_BUG: 'System Bug',
  OTHER: 'Other Concerns',
};

const PRIORITY_BADGES: Record<string, string> = {
  LOW: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
};

const STATUS_BADGES: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ASSIGNED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WAITING_FOR_EMPLOYEE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CLOSED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function HRComplaintDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const qc = useQueryClient();
  const id = params?.id as string;

  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [error, setError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch Ticket Detail
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['hr-complaint-detail', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}`);
      return res.data.data;
    },
  });

  // Fetch HR/Active Employees List for assignment dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['hr-active-employees'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=50&onboardingStatus=VERIFIED');
      return res.data.data ?? [];
    },
  });
  const employeeList = Array.isArray(employeesData) ? employeesData : employeesData?.data ?? [];

  // Assign HR Mutation
  const assignMutation = useMutation({
    mutationFn: async (assignedToId: string) => {
      await api.post(`/admin/complaints/${id}/assign`, { assignedToId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
      qc.invalidateQueries({ queryKey: ['hr-complaint-stats'] });
    },
  });

  // Update Status/Priority Mutation
  const patchMutation = useMutation({
    mutationFn: async (payload: { status?: string; priority?: string }) => {
      await api.patch(`/admin/complaints/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
      qc.invalidateQueries({ queryKey: ['hr-complaint-stats'] });
    },
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/complaints/${id}/reply`, {
        message: replyMessage.trim(),
        isInternal,
      });
    },
    onSuccess: () => {
      setReplyMessage('');
      setIsInternal(false);
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to send reply');
    },
  });

  // Resolve Ticket Mutation
  const resolveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/complaints/${id}/resolve`, { resolutionDetails: resolutionDetails.trim() });
    },
    onSuccess: () => {
      setResolutionDetails('');
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
      qc.invalidateQueries({ queryKey: ['hr-complaint-stats'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to resolve case');
    },
  });

  // Reopen Ticket Mutation
  const reopenMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/complaints/${id}/reopen`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
      qc.invalidateQueries({ queryKey: ['hr-complaint-stats'] });
    },
  });

  // Accept Complaint Mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/complaints/${id}/accept`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
      qc.invalidateQueries({ queryKey: ['hr-complaint-stats'] });
      qc.invalidateQueries({ queryKey: ['hr-complaints'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to accept complaint');
    },
  });

  // Reject Complaint Mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/complaints/${id}/reject`, { rejectReason: rejectReason.trim() });
    },
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['hr-complaint-detail', id] });
      qc.invalidateQueries({ queryKey: ['hr-complaint-stats'] });
      qc.invalidateQueries({ queryKey: ['hr-complaints'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to reject complaint');
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setError('');
    replyMutation.mutate();
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionDetails.trim()) return;
    setError('');
    resolveMutation.mutate();
  };

  if (isLoading) {
    return (
      <HRLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </HRLayout>
    );
  }

  if (!ticket) {
    return (
      <HRLayout>
        <div className="text-center py-20 space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-white font-bold">Ticket Not Found</h2>
          <p className="text-neutral-500 text-xs">The support ticket you are looking for does not exist or has been deleted.</p>
          <button onClick={() => router.push('/hr/complaints')} className="text-xs text-blue-400 hover:underline">
            Back to Helpdesk Queue
          </button>
        </div>
      </HRLayout>
    );
  }

  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';
  const isOpen = ticket.status === 'OPEN';
  const isRejected = ticket.status === 'REJECTED';

  return (
    <HRLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hr/complaints')}
              className="w-9 h-9 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500">{ticket.complaintNumber}</p>
              <h1 className="text-xl font-bold text-white tracking-tight leading-normal mt-0.5">{ticket.title}</h1>
            </div>
          </div>

          {/* Ticket Description */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description</p>
              {ticket.anonymous && (
                <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg font-bold uppercase">
                  <EyeOff className="w-3 h-3" /> Anonymous Complaint
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-300 leading-[1.8] whitespace-pre-wrap bg-black/40 border border-neutral-850 rounded-xl p-5 font-[Inter]">
              {ticket.description}
            </div>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Attachments</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ticket.attachments.map((file: any) => (
                    <a
                      key={file.id}
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}${file.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-black/50 border border-neutral-855 hover:border-neutral-700 rounded-xl text-[11px] text-neutral-300 transition-colors group"
                    >
                      <span className="flex items-center gap-2 truncate pr-2">
                        <Paperclip className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">{file.fileName}</span>
                      </span>
                      <Download className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accept / Reject Actions - Only for OPEN tickets */}
          {isOpen && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Quick Actions</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (window.confirm('Accept this complaint and move it to IN_PROGRESS?')) {
                      acceptMutation.mutate();
                    }
                  }}
                  disabled={acceptMutation.isPending}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  🟢 Accept
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  🔴 Reject
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 font-semibold">{error}</p>
              )}
            </div>
          )}

          {/* Conversation Thread */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Communication Feed</h3>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {ticket.replies.map((reply: any) => {
                const isInternalNote = reply.isInternal;
                const isEmployee = reply.senderRole === 'Employee' || reply.senderRole === 'Anonymous';
                return (
                  <div
                    key={reply.id}
                    className={`flex flex-col space-y-1.5 p-4 rounded-xl border max-w-[85%] ${
                      isInternalNote
                        ? 'bg-amber-500/5 border-amber-500/20 self-start mr-auto'
                        : isEmployee
                        ? 'bg-neutral-850/60 border-neutral-800 self-start mr-auto'
                        : 'bg-blue-600/5 border-blue-500/10 self-end ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-[10px] font-extrabold text-neutral-300 flex items-center gap-1.5">
                        {reply.sender}
                        {isInternalNote && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                            <EyeOff className="w-2.5 h-2.5" /> Internal Note
                          </span>
                        )}
                        {isEmployee && reply.senderRole === 'Anonymous' && (
                          <span className="text-[8px] bg-neutral-800 text-neutral-550 border border-neutral-700 px-1 py-0.5 rounded font-bold uppercase">
                            Anon
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] text-neutral-550 font-medium">
                        {new Date(reply.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-[Inter]">
                      {reply.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            {!isClosed && !isResolved && (
              <form onSubmit={handleReplySubmit} className="pt-4 border-t border-neutral-800 space-y-3.5">
                <div>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response to the employee or log internal notes..."
                    rows={3}
                    disabled={replyMutation.isPending}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-450 font-bold group-hover:text-neutral-300 select-none">
                      Mark as Internal Note (Private to HR)
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Reply
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-400 font-semibold">{error}</p>
                )}
              </form>
            )}
          </div>

          {/* Case Resolution Details Input */}
          {!isClosed && !isResolved && (
            <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-4.5 h-4.5" /> Resolve Complaint Ticket
              </h3>
              <form onSubmit={handleResolveSubmit} className="space-y-3">
                <textarea
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  placeholder="Summarize the final solution details. This resolution description will be visible to the employee."
                  rows={3}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!resolutionDetails.trim() || resolveMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl text-xs font-bold text-white flex items-center gap-1 transition-colors"
                  >
                    {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Resolve Ticket Case
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Columns: Admin controls, Assignee, Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Case Status Settings</h3>

            <div className="space-y-4">
              {/* Employee Profiling */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Raised By</span>
                <span className="text-xs text-white font-semibold block mt-1">
                  {ticket.anonymous ? 'Anonymous Employee' : `${ticket.raisedBy.firstName} ${ticket.raisedBy.lastName}`}
                </span>
                {!ticket.anonymous && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[10px] text-neutral-500 font-semibold">{ticket.raisedBy.email}</p>
                    <p className="text-[10px] text-neutral-500 font-semibold">
                      Dept: {ticket.raisedBy.department} · Desg: {ticket.raisedBy.designation}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Status</span>
                <div className="flex gap-2 items-center mt-1.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${STATUS_BADGES[ticket.status] || STATUS_BADGES.OPEN}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                  {!isClosed && !isResolved && (
                    <select
                      value={newStatus}
                      onChange={(e) => {
                        setNewStatus(e.target.value);
                        patchMutation.mutate({ status: e.target.value });
                      }}
                      className="bg-black border border-neutral-850 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Change Status...</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_EMPLOYEE">Waiting for Employee</option>
                      <option value="REJECTED">Reject / Reject Action</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Priority Update */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Priority</span>
                <div className="flex gap-2 items-center mt-1.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold ${PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.LOW}`}>
                    {ticket.priority}
                  </span>
                  {!isClosed && !isResolved && (
                    <select
                      value={newPriority}
                      onChange={(e) => {
                        setNewPriority(e.target.value);
                        patchMutation.mutate({ priority: e.target.value });
                      }}
                      className="bg-black border border-neutral-855 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Change Priority...</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  )}
                </div>
              </div>

              {/* HR Assignee Selector */}
              {!isClosed && !isResolved && (
                <div className="pt-2 border-t border-neutral-800">
                  <label className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1.5">
                    Assign Ticket Case HR Agent
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => {
                      setAssigneeId(e.target.value);
                      if (e.target.value) {
                        assignMutation.mutate(e.target.value);
                      }
                    }}
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Assignee...</option>
                    {employeeList.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reopen resolved ticket */}
              {isResolved && (
                <button
                  onClick={() => {
                    if (window.confirm('Reopen this support ticket case?')) {
                      reopenMutation.mutate();
                    }
                  }}
                  disabled={reopenMutation.isPending}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 rounded-xl text-xs font-bold text-blue-400 flex items-center justify-center gap-1.5 transition-all border border-blue-500/10 hover:border-blue-500/25"
                >
                  <Clock className="w-4 h-4" /> Reopen Ticket
                </button>
              )}
            </div>
          </div>

          {/* Activity Log Timeline */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Activity History Timeline</h3>

            <div className="space-y-4 relative pl-3 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-800">
              {ticket.timeline.map((event: any) => (
                <div key={event.id} className="relative space-y-1">
                  <div className="absolute top-1 -left-[15px] w-2 h-2 rounded-full bg-blue-500 border border-black" />
                  <p className="text-[10px] font-bold text-white">{event.action.replace(/_/g, ' ')}</p>
                  <p className="text-[9px] text-neutral-500 leading-normal">{event.details}</p>
                  <div className="flex justify-between text-[8px] text-neutral-600">
                    <span>By: {event.actorName}</span>
                    <span>
                      {new Date(event.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Reject Complaint</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setError('');
                }}
                className="w-8 h-8 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Reason for Rejection <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a clear reason why this complaint is being rejected..."
                  rows={4}
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-semibold">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setError('');
                  }}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 rounded-xl text-xs font-bold text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      setError('Please provide a reason for rejection');
                      return;
                    }
                    setError('');
                    rejectMutation.mutate();
                  }}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Reject Complaint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
