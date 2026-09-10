'use client';

import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-3">
            <Settings className="w-7 h-7 text-muted-foreground" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System configuration and preferences
          </p>
        </div>

        <div className="bg-secondary border border-border rounded-2xl p-12 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Settings coming soon</p>
        </div>
      </div>
    </AdminLayout>
  );
}
