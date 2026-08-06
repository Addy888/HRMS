'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { Calendar } from 'lucide-react';

export default function SalaryHistoryPage() {
  return (
    <HRLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
              Salary History
            </h1>
            <p className="text-sm text-neutral-400">View historical payroll records</p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8">
          <p className="text-sm text-neutral-400 text-center">
            Salary history will be displayed here
          </p>
        </div>
      </div>
    </HRLayout>
  );
}
