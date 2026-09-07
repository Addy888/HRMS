'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function PlatformReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">Platform Reports</h1>
      
      <Card className="p-12 text-center">
        <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Reports Coming Soon
        </h3>
        <p className="text-neutral-600">
          Platform-wide analytics and reports will be available here.
        </p>
      </Card>
    </div>
  );
}
