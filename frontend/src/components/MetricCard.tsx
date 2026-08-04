import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard = ({ title, value, description, icon, loading }: MetricCardProps) => {
  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-neutral-800 rounded"></div>
          <div className="h-5 w-5 bg-neutral-800 rounded-full"></div>
        </div>
        <div className="h-8 w-16 bg-neutral-800 rounded"></div>
        <div className="h-3 w-32 bg-neutral-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="group bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-800 rounded-2xl p-6 transition-all duration-300 shadow-sm relative overflow-hidden">
      {/* Background radial soft light highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
      
      <div className="flex justify-between items-start relative z-10">
        <span className="text-sm text-neutral-400 font-medium tracking-tight">{title}</span>
        {icon && <div className="text-neutral-500 group-hover:text-blue-400 transition-colors duration-300">{icon}</div>}
      </div>
      
      <div className="mt-4 relative z-10">
        <span className="font-heading text-3xl font-bold tracking-tight text-white">{value}</span>
        {description && (
          <p className="text-xs text-neutral-500 mt-1 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
};
