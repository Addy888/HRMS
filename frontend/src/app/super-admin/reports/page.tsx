'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Loader2,
  Filter,
  FileDown,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';

function ReportCard({ title, description, icon: Icon, color, onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {loading ? (
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
        ) : (
          <Download className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 transition-colors" />
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400">{description}</p>
    </button>
  );
}

export default function SuperAdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Fetch dashboard stats for report summary
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-reports-stats'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/stats');
      return res.data.data || res.data;
    },
  });

  // Fetch process overview
  const { data: processes, isLoading: processLoading } = useQuery({
    queryKey: ['super-admin-reports-processes'],
    queryFn: async () => {
      const res = await api.get('/super-admin/dashboard/process-overview');
      return res.data.data || res.data;
    },
  });

  const isLoading = statsLoading || processLoading;

  const handleDownloadReport = async (reportType: string) => {
    try {
      setDownloadingReport(reportType);
      
      // Simulate report generation (replace with actual API call when available)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, you would call an API endpoint like:
      // const response = await api.get(`/super-admin/reports/${reportType}`, {
      //   params: { month: selectedMonth, year: selectedYear },
      //   responseType: 'blob'
      // });
      
      alert(`${reportType} report will be downloaded when API is implemented`);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    } finally {
      setDownloadingReport(null);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/login">
      <SuperAdminLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-500" />
              Reports & Analytics
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Generate and download comprehensive business reports
            </p>
          </div>

          {/* Period Selector */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-white">Report Period</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-neutral-500 font-semibold uppercase">Employees</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{stats?.totalEmployees || 0}</h3>
              <p className="text-xs text-neutral-400 mt-1">
                {stats?.activeEmployees || 0} active
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <Layers className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-neutral-500 font-semibold uppercase">Processes</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{stats?.totalProcesses || 0}</h3>
              <p className="text-xs text-neutral-400 mt-1">Departments</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-xs text-neutral-500 font-semibold uppercase">Payroll</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                ₹{((stats?.totalMonthlyPayroll || 0) / 100000).toFixed(1)}L
              </h3>
              <p className="text-xs text-neutral-400 mt-1">Monthly</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-xs text-neutral-500 font-semibold uppercase">Attendance</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{stats?.presentToday || 0}</h3>
              <p className="text-xs text-neutral-400 mt-1">Present today</p>
            </div>
          </div>

          {/* Available Reports */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <h2 className="font-heading text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileDown className="w-5 h-5 text-purple-500" />
              Available Reports
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ReportCard
                title="Employee Report"
                description="Complete employee directory with all personal and employment details"
                icon={Users}
                color="bg-gradient-to-br from-blue-600 to-indigo-700"
                onClick={() => handleDownloadReport('employee')}
                loading={downloadingReport === 'employee'}
              />

              <ReportCard
                title="Payroll Report"
                description="Comprehensive payroll breakdown by department and employee"
                icon={DollarSign}
                color="bg-gradient-to-br from-emerald-600 to-teal-700"
                onClick={() => handleDownloadReport('payroll')}
                loading={downloadingReport === 'payroll'}
              />

              <ReportCard
                title="Attendance Report"
                description="Monthly attendance summary with check-in/out times and status"
                icon={Clock}
                color="bg-gradient-to-br from-amber-600 to-orange-700"
                />

              <ReportCard
                title="Process Report"
                description="Department-wise employee count, payroll, and performance metrics"
                icon={Layers}
                color="bg-gradient-to-br from-purple-600 to-pink-700"
                onClick={() => handleDownloadReport('process')}
                loading={downloadingReport === 'process'}
              />

              <ReportCard
                title="Analytics Report"
                description="Business intelligence dashboard with key metrics and trends"
                icon={TrendingUp}
                color="bg-gradient-to-br from-indigo-600 to-blue-700"
                onClick={() => handleDownloadReport('analytics')}
                loading={downloadingReport === 'analytics'}
              />

              <ReportCard
                title="Comprehensive Report"
                description="All-in-one report combining employee, payroll, and attendance data"
                icon={FileText}
                color="bg-gradient-to-br from-rose-600 to-pink-700"
                onClick={() => handleDownloadReport('comprehensive')}
                loading={downloadingReport === 'comprehensive'}
              />
            </div>
          </div>

          {/* Recent Activity / Data Preview */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="font-heading text-xl font-bold text-white">Process Overview</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Current organizational structure snapshot
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Process</th>
                    <th className="px-6 py-4 text-center">Employees</th>
                    <th className="px-6 py-4 text-center">Active</th>
                    <th className="px-6 py-4 text-right">Monthly Payroll</th>
                    <th className="px-6 py-4 text-right">Avg Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : processes && processes.length > 0 ? (
                    processes.slice(0, 5).map((process: any) => (
                      <tr key={process.id} className="hover:bg-neutral-900/30 transition-colors text-sm">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                              <Layers className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white">{process.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-neutral-300">
                          {process.totalEmployees}
                        </td>
                        <td className="px-6 py-4 text-center text-emerald-400">
                          {process.activeEmployees}
                        </td>
                        <td className="px-6 py-4 text-right text-white font-semibold">
                          ₹{process.totalMonthlyPayroll.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right text-neutral-300">
                          ₹{process.avgSalary.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-500">
                        No process data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && processes && processes.length > 5 && (
              <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/30 text-center">
                <p className="text-xs text-neutral-400">
                  Showing 5 of {processes.length} processes
                </p>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-blue-400 mb-1">Report Generation</h3>
                <p className="text-sm text-blue-300/80 leading-relaxed">
                  Reports are generated based on the selected period and include data from all processes and employees. 
                  Download reports in Excel or PDF format for detailed analysis and record-keeping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
