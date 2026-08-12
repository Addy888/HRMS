'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HRLayout from '@/layouts/HRLayout';
import { DollarSign } from 'lucide-react';

function SalaryStructureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  useEffect(() => {
    if (!employeeId) {
      router.push('/hr/payroll/employees');
    }
  }, [employeeId, router]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
            Configure Salary Structure
          </h1>
          <p className="text-sm text-neutral-400">
            Set up salary components for employee
          </p>
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8">
        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-400">
            Employee ID: {employeeId}
          </p>
          <p className="text-sm text-neutral-500">
            Salary structure configuration form will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewSalaryStructurePage() {
  return (
    <HRLayout>
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SalaryStructureContent />
      </Suspense>
    </HRLayout>
  );
}
