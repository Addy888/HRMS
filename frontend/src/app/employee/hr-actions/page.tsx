'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AlertTriangle,
  Calendar,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatActionType, formatStatus } from '@/lib/dateUtils';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles: Record<string, string> = {
    LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${styles[severity] || 'bg-secondary text-muted-foreground border-border'}`}>
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
    DRAFT: { bg: 'bg-background0/10 text-muted-foreground border-neutral-500/20', icon: <FileText className="w-3 h-3" /> },
    ISSUED: { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <AlertCircle className="w-3 h-3" /> },
    VIEWED: { bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: <Eye className="w-3 h-3" /> },
    SENT: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <Clock className="w-3 h-3" /> },
    ACKNOWLEDGED: { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    RESPONSE_PENDING: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
    RESPONSE_SUBMITTED: { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    RESOLVED: { bg: 'bg-green-500/10 text-green-400 border-green-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    CANCELLED: { bg: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="w-3 h-3" /> },
  };

  const style = styles[status] || styles.DRAFT;

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded flex items-center gap-1 w-max ${style.bg}`}>
      {style.icon}
      {formatStatus(status)}
    </span>
  );
};

export default function EmployeeHRActionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-hr-actions'],
    queryFn: async () => {
      console.log('[EMPLOYEE HR ACTIONS] Fetching from /hr-actions/my/actions');
      const res = await api.get('/hr-actions/my/actions');
      console.log('[EMPLOYEE HR ACTIONS] Response:', res.data);
      return res.data;
    },
  });

  // Ensure actions is always an array
  const actions = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className="text-muted-foreground">Failed to load HR actions</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            HR Actions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View official HR warnings, notices, and disciplinary actions issued to you
          </p>
        </div>

        {/* Actions List */}
        {!actions || actions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <AlertTriangle className="w-16 h-16 text-card-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No HR Actions</h3>
            <p className="text-muted-foreground">No HR actions have been issued to you</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {actions.map((action: any) => (
              <div
                key={action.id}
                className="bg-card border border-border hover:border-amber-500/50 rounded-2xl p-6 transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-muted-foreground font-mono font-bold">
                        {action.actionNumber}
                      </span>
                      <SeverityBadge severity={action.severity} />
                      <StatusBadge status={action.status} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-amber-600 transition-colors">
                      {action.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {formatActionType(action.actionType)}
                    </p>
                  </div>
                  <Link
                    href={`/employee/hr-actions/${action.id}`}
                    className="p-2 rounded-lg bg-secondary hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 border border-border hover:border-amber-500/50 transition-all"
                    title="View details"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>

                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Incident: {formatDate(action.incidentDate)}
                  </div>
                  {action.issuedAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Issued: {formatDate(action.issuedAt)}
                    </div>
                  )}
                  {action.issuedBy?.employee && (
                    <div>
                      By: {action.issuedBy.employee.firstName} {action.issuedBy.employee.lastName}
                    </div>
                  )}
                </div>

                {action.responseRequired && action.status === 'ISSUED' && (
                  <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-600 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Response Required
                      {action.responseDeadline && (
                        <span className="text-muted-foreground">
                          (Deadline: {formatDate(action.responseDeadline)})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
