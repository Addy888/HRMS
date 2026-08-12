'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  CreditCard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import SalaryDetailsDrawer from '@/components/SalaryDetailsDrawer';

// Types
interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  basicSalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  payrollStatus: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID' | 'REJECTED';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
}

interface SalaryHistorySummary {
  totalPayslips: number;
  totalPayrollAmount: number;
  averageSalary: number;
  highestSalary: number;
  pendingPayments: number;
  processedPayrolls: number;
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
}


export default function SalaryHistoryPage() {
  const currentDate = new Date();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [payrollStatus, setPayrollStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery<SalaryHistorySummary>({
    queryKey: ['salary-history-summary'],
    queryFn: async () => {
      const response = await api.get('/salary-history/summary');
      return response.data?.data || {
        totalPayslips: 0,
        totalPayrollAmount: 0,
        averageSalary: 0,
        highestSalary: 0,
        pendingPayments: 0,
        processedPayrolls: 0,
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

  // Fetch employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data?.data || [];
    },
  });

  // Fetch salary history
  const {
    data: salaryData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'salary-history',
      selectedEmployee,
      selectedDepartment,
      selectedMonth,
      selectedYear,
      payrollStatus,
      paymentStatus,
      searchTerm,
      currentPage,
    ],
    queryFn: async () => {
      const response = await api.get('/salary-history', {
        params: {
          employeeId: selectedEmployee || undefined,
          departmentId: selectedDepartment || undefined,
          month: selectedMonth || undefined,
          year: selectedYear || undefined,
          payrollStatus: payrollStatus || undefined,
          paymentStatus: paymentStatus || undefined,
          search: searchTerm || undefined,
          page: currentPage,
          limit: pageSize,
        },
      });
      return response.data?.data || { records: [], pagination: { total: 0, page: 1, pages: 1 } };
    },
  });

  const salaryRecords = salaryData?.records || [];
  const pagination = salaryData?.pagination || { total: 0, page: 1, pages: 1 };

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/salary-history/export/excel', {
        params: {
          employeeId: selectedEmployee || undefined,
          departmentId: selectedDepartment || undefined,
          month: selectedMonth || undefined,
          year: selectedYear || undefined,
        },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_history_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel exported successfully!');
    },
    onError: () => {
      toast.error('Failed to export Excel');
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/salary-history/export/pdf', {
        params: {
          employeeId: selectedEmployee || undefined,
          departmentId: selectedDepartment || undefined,
          month: selectedMonth || undefined,
          year: selectedYear || undefined,
        },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_history_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exported successfully!');
    },
    onError: () => {
      toast.error('Failed to export PDF');
    },
  });

  // Download payslip
  const downloadPayslipMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const response = await api.get(`/salary-history/payslip/${recordId}`, {
        responseType: 'blob',
      });
      return { data: response.data, recordId };
    },
    onSuccess: ({ data, recordId }) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Payslip downloaded!');
    },
    onError: () => {
      toast.error('Failed to download payslip');
    },
  });

  // View details
  const handleViewDetails = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setShowDetailsDrawer(true);
  };

  // Status colors
  const getPayrollStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      GENERATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.DRAFT;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.PENDING;
  };

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Payslips',
      value: summary?.totalPayslips || 0,
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Total Payroll Amount',
      value: `₹${((summary?.totalPayrollAmount || 0) / 100000).toFixed(2)}L`,
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Average Salary',
      value: `₹${((summary?.averageSalary || 0) / 1000).toFixed(1)}K`,
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Highest Salary',
      value: `₹${((summary?.highestSalary || 0) / 100000).toFixed(2)}L`,
      icon: <CreditCard className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Pending Payments',
      value: summary?.pendingPayments || 0,
      icon: <Clock className="w-6 h-6 text-red-400" />,
      color: 'from-red-500 to-rose-600',
    },
    {
      title: 'Processed Payrolls',
      value: summary?.processedPayrolls || 0,
      icon: <CheckCircle className="w-6 h-6 text-green-400" />,
      color: 'from-green-500 to-emerald-600',
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

  if (isLoading || summaryLoading) {
    return (
      <HRLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-12 bg-neutral-900 rounded-lg w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                Salary History
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                View and manage employee salary history and payroll records
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={() => exportPdfMutation.mutate()}
              disabled={exportPdfMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => {
                exportExcelMutation.mutate();
              }}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {/* Employee Filter */}
            <div className="relative xl:col-span-2">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Employees</option>
                {(employees || []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Departments</option>
                {(departments || []).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value ? Number(e.target.value) : '');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Months</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value ? Number(e.target.value) : '');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Payroll Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={payrollStatus}
                onChange={(e) => {
                  setPayrollStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Payroll Status</option>
                <option value="DRAFT">Draft</option>
                <option value="GENERATED">Generated</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Salary History Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          {!salaryRecords || salaryRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <Calendar className="w-16 h-16 text-neutral-700 mb-4" />
              <h3 className="font-semibold text-white mb-2">No salary history found</h3>
              <p className="text-sm text-neutral-500 text-center max-w-sm">
                {searchTerm || selectedEmployee || selectedDepartment
                  ? 'Try adjusting your filters'
                  : 'Salary records will appear here once payroll is processed'}
              </p>
            </div>
          ) : (
            <>
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
                        Month
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Basic
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
                        Payment Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Payroll Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {salaryRecords.map((record: any, index: number) => (
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
                          <div className="text-sm text-white font-medium">
                            {months.find((m) => m.value === record.month)?.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-white font-medium">{record.year}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-neutral-300">
                            ₹{record.basicSalary.toLocaleString()}
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
                          <div className="text-sm text-neutral-300">
                            {record.paymentDate
                              ? new Date(record.paymentDate).toLocaleDateString()
                              : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {record.paymentMethod || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPayrollStatusColor(
                              record.payrollStatus
                            )}`}
                          >
                            {record.payrollStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                              record.paymentStatus
                            )}`}
                          >
                            {record.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(record)}
                              className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors group"
                              title="View Salary Details"
                            >
                              <Eye className="w-4 h-4 text-neutral-400 group-hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => downloadPayslipMutation.mutate(record.id)}
                              disabled={record.payrollStatus !== 'PAID'}
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

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800">
                  <div className="text-sm text-neutral-400">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Salary Details Drawer */}
      {showDetailsDrawer && selectedRecord && (
        <SalaryDetailsDrawer
          record={selectedRecord}
          onClose={() => {
            setShowDetailsDrawer(false);
            setSelectedRecord(null);
          }}
        />
      )}
    </HRLayout>
  );
}
