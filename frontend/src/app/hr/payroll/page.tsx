'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { MetricCard } from '@/components/MetricCard';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FileText,
  CreditCard 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function PayrollDashboard() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['payroll-dashboard-stats', currentMonth, currentYear],
    queryFn: async () => {
      const response = await api.get('/payroll-processing/dashboard/stats', {
        params: { month: currentMonth, year: currentYear }
      });
      return response.data?.data ?? response.data;
    },
  });

  const cardsData = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <Users className="w-5 h-5 text-blue-400" />,
      desc: 'Registered employees',
    },
    {
      title: 'Pending Payroll',
      value: stats?.pendingPayroll || 0,
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      desc: 'Awaiting processing',
    },
    {
      title: 'Processed Payroll',
      value: stats?.processedPayroll || 0,
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      desc: 'Ready for payment',
    },
    {
      title: 'Paid Employees',
      value: stats?.paidEmployees || 0,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      desc: 'Payment completed',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: <CreditCard className="w-5 h-5 text-rose-400" />,
      desc: 'Awaiting payment',
    },
    {
      title: 'Monthly Expense',
      value: `₹${(stats?.monthlySalaryExpense || 0).toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5 text-purple-400" />,
      desc: 'Total salary this month',
    },
    {
      title: 'Average Salary',
      value: `₹${(stats?.averageSalary || 0).toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
      desc: 'Per employee average',
    },
  ];

  if (isError) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-14 h-14 text-red-400" />
          <h2 className="font-heading text-xl font-bold text-white">Failed to load dashboard</h2>
          <p className="text-sm text-neutral-400">Please try again later</p>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
            Payroll Dashboard
          </h1>
          <p className="text-sm text-neutral-400">
            Payroll overview for {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cardsData.map((card) => (
            <MetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.desc}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/hr/payroll/salary-structure"
            className="group bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Salary Structure</h3>
                <p className="text-xs text-neutral-400">Manage salary templates</p>
              </div>
            </div>
          </a>

          <a
            href="/hr/payroll/processing"
            className="group bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Process Payroll</h3>
                <p className="text-xs text-neutral-400">Generate monthly payroll</p>
              </div>
            </div>
          </a>

          <a
            href="/hr/payroll/payslips"
            className="group bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Salary Slips</h3>
                <p className="text-xs text-neutral-400">View & download slips</p>
              </div>
            </div>
          </a>

          <a
            href="/hr/payroll/reports"
            className="group bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Reports</h3>
                <p className="text-xs text-neutral-400">View payroll analytics</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </HRLayout>
  );
}
