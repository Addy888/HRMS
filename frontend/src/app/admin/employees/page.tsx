'use client';

import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Users } from 'lucide-react';

export default function AdminEmployeesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-500" />
            Employees
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all employees
          </p>
        </div>

        <div className="bg-secondary border border-border rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Employee management coming soon</p>
        </div>
      </div>
    </AdminLayout>
  );
}
