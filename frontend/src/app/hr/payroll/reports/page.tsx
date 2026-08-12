'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  TrendingUp,
  DollarSign,
  Users,
  TrendingDown,
  FileText,
  Download,
  Printer,
  Filter,
  Search,
  Calendar,
  Building2,
  Eye,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PayrollReportDrawer from '@/components/PayrollReportDrawer';

// Types
interface PayrollSummary {
  totalPayroll: number;
  totalEmployees: number;
  averageSalary: number;
  highestSalary: number;
  lowestSalary: number;
  pendingPayments: number;
  processedPayroll: number;
  totalDeductions: number;
}

interface ChartData {
  monthlyTrend: Array<{ month: string; amount: number }>;
  departmentWise: Array<{ department: string; amount: number }>;
  salaryDistribution: Array<{ range: string; count: number }>;
  allowanceBreakdown: Array<{ type: string; amount: number }>;
  deductionBreakdown: Array<{ type: string; amount: number }>;
  payrollStatus: Array<{ status: string; count: number }>;
  paymentMethod: Array<{ method: string; count: number }>;
}

interface PayrollReport {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  paymentDate: string | null;
  status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID' | 'REJECTED';
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


export default function PayrollReportsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payrollStatus, setPayrollStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<PayrollReport | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery<PayrollSummary>({
    queryKey: ['payroll-reports-summary', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get('/payroll-reports/dashboard', {
        params: { month: selectedMonth, year: selectedYear },
      });
      return (
        response.data?.data || {
          totalPayroll: 0,
          totalEmployees: 0,
          averageSalary: 0,
          highestSalary: 0,
          lowestSalary: 0,
          pendingPayments: 0,
          processedPayroll: 0,
          totalDeductions: 0,
        }
      );
    },
  });

  // Fetch chart data
  const { data: chartData, isLoading: chartsLoading } = useQuery<ChartData>({
    queryKey: ['payroll-charts', selectedMonth, selectedYear, selectedDepartment],
    queryFn: async () => {
      const response = await api.get('/payroll-reports/charts', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDepartment || undefined,
        },
      });
      return (
        response.data?.data || {
          monthlyTrend: [],
          departmentWise: [],
          salaryDistribution: [],
          allowanceBreakdown: [],
          deductionBreakdown: [],
          payrollStatus: [],
          paymentMethod: [],
        }
      );
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

  // Fetch reports
  const {
    data: reportsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'payroll-reports',
      selectedMonth,
      selectedYear,
      selectedDepartment,
      selectedEmployee,
      payrollStatus,
      paymentStatus,
      searchTerm,
      currentPage,
    ],
    queryFn: async () => {
      const response = await api.get('/payroll-reports', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDepartment || undefined,
          employeeId: selectedEmployee || undefined,
          payrollStatus: payrollStatus || undefined,
          paymentStatus: paymentStatus || undefined,
          search: searchTerm || undefined,
          page: currentPage,
          limit: pageSize,
        },
      });
      return response.data?.data || { reports: [], pagination: { total: 0, page: 1, pages: 1 } };
    },
  });

  const reports = reportsData?.reports || [];
  const pagination = reportsData?.pagination || { total: 0, page: 1, pages: 1 };

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/payroll-reports/export/excel', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDepartment || undefined,
        },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_report_${selectedMonth}_${selectedYear}.xlsx`);
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
      const response = await api.get('/payroll-reports/export/pdf', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDepartment || undefined,
        },
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_report_${selectedMonth}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exported successfully!');
    },
    onError: () => {
      toast.error('Failed to export PDF');
    },
  });

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleViewDetails = (report: PayrollReport) => {
    setSelectedReport(report);
    setShowDrawer(true);
  };

  // Status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      GENERATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.DRAFT;
  };

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Payroll',
      value: `₹${((summary?.totalPayroll || 0) / 100000).toFixed(2)}L`,
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500 to-teal-600',
      change: '+12.5%',
    },
    {
      title: 'Total Employees',
      value: summary?.totalEmployees || 0,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500 to-indigo-600',
      change: '+5',
    },
    {
      title: 'Average Salary',
      value: `₹${((summary?.averageSalary || 0) / 1000).toFixed(1)}K`,
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500 to-pink-600',
      change: '+8.3%',
    },
    {
      title: 'Highest Salary',
      value: `₹${((summary?.highestSalary || 0) / 100000).toFixed(2)}L`,
      icon: <CreditCard className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500 to-orange-600',
      change: '—',
    },
    {
      title: 'Lowest Salary',
      value: `₹${((summary?.lowestSalary || 0) / 1000).toFixed(1)}K`,
      icon: <TrendingDown className="w-6 h-6 text-red-400" />,
      color: 'from-red-500 to-rose-600',
      change: '—',
    },
    {
      title: 'Pending Payments',
      value: summary?.pendingPayments || 0,
      icon: <AlertCircle className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500 to-yellow-600',
      change: '-3',
    },
    {
      title: 'Processed Payroll',
      value: summary?.processedPayroll || 0,
      icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500 to-green-600',
      change: '+15',
    },
    {
      title: 'Total Deductions',
      value: `₹${((summary?.totalDeductions || 0) / 100000).toFixed(2)}L`,
      icon: <TrendingDown className="w-6 h-6 text-red-400" />,
      color: 'from-red-500 to-pink-600',
      change: '+4.2%',
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

  if (isLoading || summaryLoading || chartsLoading) {
    return (
      <HRLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-12 bg-neutral-900 rounded-lg w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-neutral-900 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-neutral-900 rounded-xl" />
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
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                Payroll Reports
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Generate payroll analytics, salary reports and financial insights
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
              onClick={handlePrint}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
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
                {card.change && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${card.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : card.change.startsWith('-') ? 'bg-red-500/10 text-red-400' : 'text-neutral-500'}`}>
                    {card.change}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-sm text-neutral-400">{card.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Reports Table Placeholder */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Payroll Reports</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!reports || reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-neutral-700 mb-4" />
              <h3 className="font-semibold text-white mb-2">No reports found</h3>
              <p className="text-sm text-neutral-500 text-center max-w-sm">
                Reports will appear here once payroll is processed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-900/50 border-b border-neutral-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">
                      Department
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">
                      Basic
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">
                      Allowances
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">
                      Gross
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase">
                      Net
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {reports.map((report: any) => (
                    <tr key={report.id} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white">{report.employeeName}</div>
                        <div className="text-xs text-neutral-500">{report.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-neutral-300">{report.department}</div>
                        <div className="text-xs text-neutral-500">{report.designation}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-300">
                        ₹{report.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-emerald-400">
                        +₹{report.allowances.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-400">
                        -₹{report.deductions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-white">
                        ₹{report.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-400">
                        ₹{report.netSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(report)}
                            className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors group"
                          >
                            <Eye className="w-4 h-4 text-neutral-400 group-hover:text-blue-400" />
                          </button>
                          <button className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors group">
                            <Download className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && selectedReport && (
        <PayrollReportDrawer
          report={selectedReport}
          onClose={() => {
            setShowDrawer(false);
            setSelectedReport(null);
          }}
        />
      )}
    </HRLayout>
  );
}
