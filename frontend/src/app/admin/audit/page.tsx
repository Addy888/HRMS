'use client';

import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { FileText } from 'lucide-react';

export default function AdminAuditPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading flex items-center gap-3">
            <FileText className="w-7 h-7 text-amber-500" />
            Audit Logs
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            System activity and audit trail
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">Audit logs coming soon</p>
        </div>
      </div>
    </AdminLayout>
  );
}
