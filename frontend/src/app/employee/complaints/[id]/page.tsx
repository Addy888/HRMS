'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import EmployeeLayout from '@/layouts/EmployeeLayout';
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
  Building
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

export default function EmployeeComplaintDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const qc = useQueryClient();
  const id = params?.id as string;

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch Ticket Details
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['employee-complaint-detail', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}`);
      return res.data.data;
    },
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/complaints/${id}/reply`, { message: message.trim() });
    },
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['employee-complaint-detail', id] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to reply');
    },
  });

  // Close Mutation
  const closeMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/complaints/${id}/close`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-complaint-detail', id] });
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError('');
    replyMutation.mutate();
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!ticket) {
    return (
      <EmployeeLayout>
        <div className="text-center py-20 space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-white font-bold">Ticket Not Found</h2>
          <p className="text-neutral-500 text-xs">The support ticket you are looking for does not exist or has been restricted.</p>
          <button onClick={() => router.push('/employee/complaints')} className="text-xs text-blue-400 hover:underline">
            Back to Helpdesk
          </button>
        </div>
      </EmployeeLayout>
    );
  }

  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';
  const showCloseButton = !isClosed;

  return (
    <EmployeeLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Subject and Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/employee/complaints')}
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
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description</p>
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
                      className="flex items-center justify-between p-3 bg-black/50 border border-neutral-850 hover:border-neutral-700 rounded-xl text-[11px] text-neutral-300 transition-colors group"
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

          {/* Conversation Thread */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Messages Thread</h3>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {ticket.replies.length === 0 ? (
                <p className="text-xs text-neutral-550 italic text-center py-6">No messages in this thread yet.</p>
              ) : (
                ticket.replies.map((reply: any) => {
                  const isHR = reply.senderRole === 'HR';
                  const isUserAnonymous = reply.senderRole === 'Anonymous';
                  return (
                    <div
                      key={reply.id}
                      className={`flex flex-col space-y-1.5 p-4 rounded-xl border max-w-[85%] ${
                        isHR
                          ? 'bg-neutral-850/60 border-neutral-800 self-start mr-auto'
                          : 'bg-blue-600/5 border-blue-500/10 self-end ml-auto'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-[10px] font-extrabold text-neutral-300">
                          {reply.sender} {isHR && <span className="text-blue-400 font-medium ml-1">· HR Agent</span>}
                          {isUserAnonymous && <span className="text-neutral-500 font-medium ml-1">· Anonymous</span>}
                        </span>
                        <span className="text-[9px] text-neutral-550">
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
                })
              )}
            </div>

            {/* Message input */}
            {!isClosed && (
              <form onSubmit={handleReplySubmit} className="pt-4 border-t border-neutral-800">
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message reply..."
                    disabled={replyMutation.isPending}
                    className="flex-1 bg-black border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || replyMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-white flex items-center justify-center transition-colors"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-[10px] text-red-400 font-semibold mt-2">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Right 1 Column: Ticket Metadata & Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ticket Info</h3>

            <div className="space-y-3.5">
              {/* Category */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Category</span>
                <span className="text-xs text-white font-semibold mt-1 block">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </span>
              </div>

              {/* Priority */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Priority</span>
                <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold mt-1 ${PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.LOW}`}>
                  {ticket.priority}
                </span>
              </div>

              {/* Status */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Status</span>
                <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold mt-1 ${STATUS_BADGES[ticket.status] || STATUS_BADGES.OPEN}`}>
                  {ticket.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Assigned HR */}
              <div>
                <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Assigned HR Agent</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-7 h-7 bg-neutral-800 rounded-lg flex items-center justify-center text-[10px] text-neutral-400 font-bold">
                    {ticket.assignedTo ? `${ticket.assignedTo.firstName?.[0]}${ticket.assignedTo.lastName?.[0]}` : '—'}
                  </div>
                  <span className="text-xs text-white font-semibold">
                    {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                <div>
                  <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Created</span>
                  <span className="text-[10px] text-neutral-300 font-semibold block mt-0.5">
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Updated</span>
                  <span className="text-[10px] text-neutral-300 font-semibold block mt-0.5">
                    {new Date(ticket.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions (Close Ticket) */}
            {showCloseButton && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to close this ticket?')) {
                    closeMutation.mutate();
                  }
                }}
                disabled={closeMutation.isPending}
                className="w-full mt-4 py-2 bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-2 transition-all border border-red-500/10 hover:border-red-500/25"
              >
                {closeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Mark Closed / Resolved
              </button>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ticket Timeline</h3>

            <div className="space-y-4 pr-1 relative pl-3 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-800">
              {ticket.timeline.map((event: any) => (
                <div key={event.id} className="relative space-y-1">
                  {/* Dot */}
                  <div className="absolute top-1 -left-[15px] w-2 h-2 rounded-full bg-blue-500 border border-black" />
                  <p className="text-[10px] font-bold text-white">{event.action.replace(/_/g, ' ')}</p>
                  <p className="text-[9px] text-neutral-500 leading-normal">{event.details}</p>
                  <p className="text-[8px] text-neutral-600 font-mono">
                    {new Date(event.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
