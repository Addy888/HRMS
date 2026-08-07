'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  CreditCard,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Lock,
  Play,
  Eye,
  Edit,
  Filter,
  Search,
  Clock,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PayrollDetailsDrawer from '@/components/PayrollDetailsDrawer';
import ProcessPayrollModal from '@/components/ProcessPayrollModal';

// Types
interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  workingDays: number;
  present: number;
  leaves: number;
  weekOffs: number;
  holidays: number;
  overtime: number;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'CALCULATED' | 'VERIFIED' | 'APPROVED' | 'LOCKED' | 'PAID' | 'REJECTED';
}

interface PayrollStats {
  totalEmployees: number;
  configuredStructures: number;
  attendanceCompleted: number;
  leavesProcessed: number;
  grossPayroll: number;
  totalDeductions: number;
  netPayroll: number;
  pendingEmployees: number;
}

interface Department {
  id: string;
  name: string;
}

export default function PayrollProcessingPage() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<PayrollStats>({
    queryKey: ['payroll-stats', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get('/payroll-processing/dashboard/stats', {
        params: { month: selectedMonth, year: selectedYear },
      });
      return response.data?.data || {
        totalEmployees: 0,
        configuredStructures: 0,
        attendanceCompleted: 0,
        leavesProcessed: 0,
        grossPayroll: 0,
        totalDeductions: 0,
        netPayroll: 0,
        pendingEmployees: 0,
      };
    },
  });

  // Fetch departments
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  // Fetch payroll records
  const {
    data: payrollRecords,
    isLoading,
    refetch,
  } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll-records', selectedMonth, selectedYear, departmentFilter, statusFilter, searchTerm],
    queryFn: async () => {
      const response = await api.get('/payroll-processing', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          department: departmentFilter || undefined,
          status: statusFilter || undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data?.data || [];
    },
  });

  // Generate payroll mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/payroll-processing/generate', {
        month: selectedMonth,
        year: selectedYear,
      });
    },
    onSuccess: () => {
      toast.success('Payroll generated successfully!');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate payroll');
    },
  });

  // Lock payroll mutation
  const lockMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/payroll-processing/lock', {
        month: selectedMonth,
        year: selectedYear,
      });
    },
    onSuccess: () => {
      toast.success('Payroll locked successfully!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to lock payroll');
    },
  });

  // Generate payslips mutation
  const generatePayslipsMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/payroll-processing/generate-payslips', {
        month: selectedMonth,
        year: selectedYear,
      });
    },
    onSuccess: () => {
      toast.success('Payslips generated successfully!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate payslips');
    },
  });

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/payroll-processing/export/excel', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel exported successfully!');
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/payroll-processing/export/pdf', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exported successfully!');
    },
  });

  // View payroll details
  const handleViewPayroll = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setShowDetailsDrawer(true);
  };

  // Download individual payslip
  const downloadPayslip = useMutation({
    mutationFn: async (payrollId: string) => {
      const response = await api.get(`/payroll-processing/${payrollId}/payslip`, {
        responseType: 'blob',
      });
      return { data: response.data, payrollId };
    },
    onSuccess: ({ data, payrollId }) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payrollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Payslip downloaded!');
    },
  });

  // Status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      CALCULATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      VERIFIED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      LOCKED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.DRAFT;
  };

  // Summary cards
  const summaryCards = [
    {
      title: 'Employees',
      value: stats?.totalEmployees || 0,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Configured',
      value: stats?.configuredStructures || 0,
      icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Attendance Complete',
      value: stats?.attendanceCompleted || 0,
      icon: <Clock className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Leaves Processed',
      value: stats?.leavesProcessed || 0,
      icon: <Calendar className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Gross Payroll',
      value: `₹${((stats?.grossPayroll || 0) / 100000).toFixed(2)}L`,
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Total Deductions',
      value: `₹${((stats?.totalDeductions || 0) / 100000).toFixed(2)}L`,
      icon: <TrendingDown className="w-6 h-6 text-red-400" />,
      color: 'from-red-500 to-rose-600',
    },
    {
      title: 'Net Payroll',
      value: `₹${((stats?.netPayroll || 0) / 100000).toFixed(2)}L`,
      icon: <DollarSign className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Pending',
      value: stats?.pendingEmployees || 0,
      icon: <AlertCircle className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500 to-yellow-600',
    },
  ];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  if (isLoading) {
    return (
      <HRLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-12 bg-neutral-900 rounded-lg w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-neutral-900 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-neutral-900 rounded-xl" />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                Payroll Processing
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Generate, review and finalize monthly payroll
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Generate Payroll
            </button>
            <button
              onClick={() => setShowProcessModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Process Payroll
            </button>
            <button
              onClick={() => lockMutation.mutate()}
              disabled={lockMutation.isPending}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Lock Payroll
            </button>
            <button
              onClick={() => generatePayslipsMutation.mutate()}
              disabled={generatePayslipsMutation.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Payslips
            </button>
            <button
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={() => exportPdfMutation.mutate()}
              disabled={exportPdfMutation.isPending}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-sm text-neutral-400">{card.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Month */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {(departments || []).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="CALCULATED">Calculated</option>
                <option value="VERIFIED">Verified</option>
                <option value="APPROVED">Approved</option>
                <option value="LOCKED">Locked</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          {!payrollRecords || payrollRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <FileText className="w-16 h-16 text-neutral-700 mb-4" />
              <h3 className="font-semibold text-white mb-2">No payroll records found</h3>
              <p className="text-sm text-neutral-500 text-center max-w-sm">
                {searchTerm || departmentFilter || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Generate payroll for the selected month to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-900/50 border-b border-neutral-800">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Leave
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      OT
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Basic
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Allowances
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {payrollRecords.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-neutral-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{record.employeeName}</div>
                          <div className="text-xs text-neutral-500">{record.employeeCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">{record.department}</div>
                        <div className="text-xs text-neutral-500">{record.designation}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-white font-medium">{record.workingDays}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-emerald-400 font-medium">{record.present}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-amber-400 font-medium">{record.leaves}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-blue-400 font-medium">{record.overtime}h</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-neutral-300">
                          ₹{record.basicSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-neutral-300">
                          ₹{record.allowances.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-white">
                          ₹{record.grossSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-red-400">
                          ₹{record.deductions.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          ₹{record.netSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewPayroll(record)}
                            className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors group"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-neutral-400 group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => downloadPayslip.mutate(record.id)}
                            disabled={record.status !== 'PAID'}
                            className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors group disabled:opacity-30"
                            title="Download Payslip"
                          >
                            <Download className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Summary */}
        {payrollRecords && payrollRecords.length > 0 && (
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Payroll Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="text-xs text-blue-400 font-semibold uppercase mb-1">Total Gross</div>
                <div className="text-xl font-bold text-white font-mono">
                  ₹{payrollRecords.reduce((sum, r) => sum + r.grossSalary, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-xs text-purple-400 font-semibold uppercase mb-1">Total PF</div>
                <div className="text-xl font-bold text-white font-mono">
                  ₹{(payrollRecords.reduce((sum, r) => sum + r.deductions, 0) * 0.3).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <div className="text-xs text-indigo-400 font-semibold uppercase mb-1">Total ESI</div>
                <div className="text-xl font-bold text-white font-mono">
                  ₹{(payrollRecords.reduce((sum, r) => sum + r.deductions, 0) * 0.2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="text-xs text-amber-400 font-semibold uppercase mb-1">Total TDS</div>
                <div className="text-xl font-bold text-white font-mono">
                  ₹{(payrollRecords.reduce((sum, r) => sum + r.deductions, 0) * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="text-xs text-red-400 font-semibold uppercase mb-1">Total Deductions</div>
                <div className="text-xl font-bold text-white font-mono">
                  ₹{payrollRecords.reduce((sum, r) => sum + r.deductions, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="text-xs text-emerald-400 font-semibold uppercase mb-1">Final Payable</div>
                <div className="text-xl font-bold text-white font-mono">
                  ₹{payrollRecords.reduce((sum, r) => sum + r.netSalary, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payroll Details Drawer */}
      {showDetailsDrawer && selectedPayroll && (
        <PayrollDetailsDrawer
          payroll={selectedPayroll}
          onClose={() => {
            setShowDetailsDrawer(false);
            setSelectedPayroll(null);
          }}
        />
      )}

      {/* Process Payroll Modal */}
      {showProcessModal && (
        <ProcessPayrollModal
          month={selectedMonth}
          year={selectedYear}
          employeeCount={payrollRecords?.length || 0}
          estimatedPayroll={stats?.netPayroll || 0}
          onClose={() => setShowProcessModal(false)}
          onSuccess={() => {
            setShowProcessModal(false);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
          }}
        />
      )}
    </HRLayout>
  );
}
