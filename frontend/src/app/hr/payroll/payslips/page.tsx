'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { FileText } from 'lucide-react';

export default function SalarySlipsPage() {
  return (
    <HRLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
              Salary Slip Generator
            </h1>
            <p className="text-sm text-neutral-400">Generate and manage employee salary slips</p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8">
          <p className="text-sm text-neutral-400 text-center">
            Salary slip management interface will be displayed here
          </p>
        </div>
      </div>
    </HRLayout>
  );
}
