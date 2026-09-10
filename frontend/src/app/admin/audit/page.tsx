'use client';

import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { FileText } from 'lucide-react';

export default function AdminAuditPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-3">
            <FileText className="w-7 h-7 text-amber-500" />
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System activity and audit trail
          </p>
        </div>

        <div className="bg-secondary border border-border rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Audit logs coming soon</p>
        </div>
      </div>
    </AdminLayout>
  );
}
