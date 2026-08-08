'use client';

import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Users } from 'lucide-react';

export default function AdminEmployeesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-500" />
            Employees
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            View and manage all employees
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">Employee management coming soon</p>
        </div>
      </div>
    </AdminLayout>
  );
}
