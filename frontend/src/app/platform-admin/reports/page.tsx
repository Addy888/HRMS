'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function PlatformReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Platform Reports</h1>
      
      <Card className="p-12 text-center">
        <BarChart3 className="h-12 w-12 text-card-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Reports Coming Soon
        </h3>
        <p className="text-muted-foreground">
          Platform-wide analytics and reports will be available here.
        </p>
      </Card>
    </div>
  );
}
