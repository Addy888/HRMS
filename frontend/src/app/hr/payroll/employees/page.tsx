'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { Users, Search } from 'lucide-react';

export default function EmployeeSalaryPage() {
  return (
    <HRLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
              Employee Salary Management
            </h1>
            <p className="text-sm text-neutral-400">View and manage employee salary structures</p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search employees by name or ID..."
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-400 text-center py-8">
            Employee salary list will be displayed here
          </p>
        </div>
      </div>
    </HRLayout>
  );
}
