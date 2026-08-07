'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FileText,
  Download,
  Mail,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  Trash2,
  Eye,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  Loader2,
  DownloadCloud,
  Send,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PayslipData {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  generatedAt: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  status: 'GENERATED' | 'DOWNLOADED' | 'EMAILED';
  downloadedAt?: string;
  emailedAt?: string;
}

interface DashboardStats {
  totalSlips: number;
  generatedSlips: number;
  downloadedSlips: number;
  emailedSlips: number;
  totalPayroll: number;
  averageSalary: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    GENERATED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      label: 'Generated',
    },
    DOWNLOADED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      label: 'Downloaded',
    },
    EMAILED: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      label: 'Emailed',
    },
  };

  const style = config[status as keyof typeof config] || config.GENERATED;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
};

const MetricCard = ({
  title,
  value,
  icon,
  description,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  loading?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-neutral-400 font-medium">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-neutral-800 rounded animate-pulse" />
        ) : (
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        )}
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </motion.div>
  );
};

export default function SalarySlipsPage() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedSlips, setSelectedSlips] = useState<string[]>([]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['salary-slips-stats', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get('/salary-slip/stats', {
        params: { month: selectedMonth, year: selectedYear },
      });
      return response.data?.data ?? response.data;
    },
  });

  // Fetch salary slips list
  const {
    data: slipsData,
    isLoading: slipsLoading,
    isError,
    refetch,
  } = useQuery<{ data: PayslipData[]; meta: any }>({
    queryKey: ['salary-slips', selectedMonth, selectedYear, searchTerm, departmentFilter],
    queryFn: async () => {
      const response = await api.get('/salary-slip/list', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          search: searchTerm,
          department: departmentFilter,
        },
      });
      return response.data?.data ?? response.data;
    },
  });

  // Fetch departments for filter
  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data?.data ?? response.data;
    },
  });

  const slips = slipsData?.data || [];

  // Download single slip
  const downloadSlipMutation = useMutation({
    mutationFn: async (payslipId: string) => {
      const response = await api.get(`/salary-slip/${payslipId}/download`, {
        responseType: 'blob',
      });
      return { data: response.data, payslipId };
    },
    onSuccess: ({ data, payslipId }) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      queryClient.invalidateQueries({ queryKey: ['salary-slips'] });
    },
  });

  // Email slip
  const emailSlipMutation = useMutation({
    mutationFn: async (payslipId: string) => {
      await api.post(`/salary-slip/${payslipId}/email`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-slips'] });
      alert('Salary slip sent successfully!');
    },
  });

  // WhatsApp slip
  const whatsappSlipMutation = useMutation({
    mutationFn: async (payslipId: string) => {
      await api.post(`/salary-slip/${payslipId}/whatsapp`);
    },
    onSuccess: () => {
      alert('Salary slip sent via WhatsApp!');
    },
  });

  // Delete slip
  const deleteSlipMutation = useMutation({
    mutationFn: async (payslipId: string) => {
      await api.delete(`/salary-slip/${payslipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-slips'] });
    },
  });

  // Bulk download
  const bulkDownloadMutation = useMutation({
    mutationFn: async (payslipIds: string[]) => {
      const response = await api.post(
        '/salary-slip/bulk-download',
        { payslipIds },
        { responseType: 'blob' }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slips-${selectedMonth}-${selectedYear}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSelectedSlips([]);
    },
  });

  const handleSelectAll = () => {
    if (selectedSlips.length === slips.length) {
      setSelectedSlips([]);
    } else {
      setSelectedSlips(slips.map((s) => s.id));
    }
  };

  const handleSelectSlip = (id: string) => {
    setSelectedSlips((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  if (isError) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-14 h-14 text-red-400" />
          <h2 className="font-heading text-xl font-bold text-white">
            Failed to load salary slips
          </h2>
          <p className="text-sm text-neutral-400">Please try again later</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white">
              Salary Slips
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Generate, manage, and distribute employee salary slips
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={slipsLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${slipsLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>

            {selectedSlips.length > 0 && (
              <button
                onClick={() => bulkDownloadMutation.mutate(selectedSlips)}
                disabled={bulkDownloadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                Download {selectedSlips.length} Slips
                {bulkDownloadMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Slips"
            value={stats?.totalSlips || 0}
            icon={<FileText className="w-6 h-6 text-blue-400" />}
            description="This month"
            loading={statsLoading}
          />
          <MetricCard
            title="Generated"
            value={stats?.generatedSlips || 0}
            icon={<Clock className="w-6 h-6 text-amber-400" />}
            description="Ready to download"
            loading={statsLoading}
          />
          <MetricCard
            title="Downloaded"
            value={stats?.downloadedSlips || 0}
            icon={<DownloadCloud className="w-6 h-6 text-emerald-400" />}
            description="By employees"
            loading={statsLoading}
          />
          <MetricCard
            title="Emailed"
            value={stats?.emailedSlips || 0}
            icon={<Send className="w-6 h-6 text-purple-400" />}
            description="Sent via email"
            loading={statsLoading}
          />
          <MetricCard
            title="Total Payroll"
            value={`₹${((stats?.totalPayroll || 0) / 100000).toFixed(1)}L`}
            icon={<DollarSign className="w-6 h-6 text-teal-400" />}
            description="This month"
            loading={statsLoading}
          />
          <MetricCard
            title="Avg Salary"
            value={`₹${((stats?.averageSalary || 0) / 1000).toFixed(0)}K`}
            icon={<Users className="w-6 h-6 text-rose-400" />}
            description="Per employee"
            loading={statsLoading}
          />
        </div>

        {/* Filters */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name or Employee ID"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
              </div>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">
                Month
              </label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none cursor-pointer"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">
                Year
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none cursor-pointer"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">
                Department
              </label>
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">
                Salary Slips ({slips.length})
              </h2>
              {slips.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {selectedSlips.length === slips.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              )}
            </div>
          </div>

          {/* Table Body */}
          {slipsLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-neutral-900 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : slips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <FileText className="w-16 h-16 text-neutral-700 mb-4" />
              <h3 className="font-semibold text-white mb-2">No salary slips found</h3>
              <p className="text-sm text-neutral-500 text-center max-w-sm">
                No salary slips have been generated for the selected period. Generate
                payroll first to create salary slips.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSlips.length === slips.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <AnimatePresence>
                    {slips.map((slip, index) => (
                      <motion.tr
                        key={slip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-neutral-900/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedSlips.includes(slip.id)}
                            onChange={() => handleSelectSlip(slip.id)}
                            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">
                              {slip.employeeName}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {slip.employeeCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {slip.department}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {slip.designation}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {months[slip.month - 1]} {slip.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-white">
                            ₹{slip.grossSalary.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-red-400">
                            -₹{slip.deductions.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-emerald-400">
                            ₹{slip.netSalary.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={slip.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => downloadSlipMutation.mutate(slip.id)}
                              disabled={downloadSlipMutation.isPending}
                              className="p-2 hover:bg-neutral-800 rounded-lg text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadSlipMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => emailSlipMutation.mutate(slip.id)}
                              disabled={emailSlipMutation.isPending}
                              className="p-2 hover:bg-neutral-800 rounded-lg text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                              title="Send via Email"
                            >
                              {emailSlipMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => whatsappSlipMutation.mutate(slip.id)}
                              disabled={whatsappSlipMutation.isPending}
                              className="p-2 hover:bg-neutral-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                              title="Send via WhatsApp"
                            >
                              {whatsappSlipMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MessageSquare className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm('Are you sure you want to delete this slip?')
                                ) {
                                  deleteSlipMutation.mutate(slip.id);
                                }
                              }}
                              disabled={deleteSlipMutation.isPending}
                              className="p-2 hover:bg-neutral-800 rounded-lg text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
}
