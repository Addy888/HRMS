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
  Plus,
  X,
  Printer,
  User,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────── Types ─────────────────── */

interface EmployeePayrollInfo {
  employeeDbId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  joiningDate: string | null;
  endDate?: string | null;
  monthlySalary: number;
  month: number;
  year: number;
  payrollRunId: string | null;
  payrollStatus: string;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  basicSalary: number;
  allowances: number;
  payslipId: string | null;
  payslipNumber: string | null;
  downloadedAt: string | null;
  generatedAt: string | null;
}

interface DashboardStats {
  totalSlips: number;
  generatedSlips: number;
  downloadedSlips: number;
  emailedSlips: number;
  totalPayroll: number;
  averageSalary: number;
}

interface SlipPreview {
  payslipId: string;
  payrollRunId: string;
  payslipNumber: string;
  generatedAt: string;
  title?: string;
  isFullAndFinal?: boolean;
  company: { name: string; logoUrl: string; address: string };
  employee: {
    employeeId: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    joiningDate: string | null;
    joiningDateFormatted?: string;
    endDate?: string | null;
    endDateFormatted?: string;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
    payPeriod?: string;
  };
  salary?: {
    monthlySalary: number;
    annualCtcLpa: string;
    previousSalary: number | null;
    currentMonthSalary: number;
    netSalary: number;
    deductions: number;
  };
  payment?: {
    status: string;
    rawStatus: string;
    paymentDate: string | null;
  };
  netSalary: number;
  grossSalary?: number;
  status: string;
}

/* ─────────────────── Components ─────────────────── */

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    NOT_GENERATED: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-500',
      border: 'border-orange-500/20',
      label: 'Payroll Not Generated',
    },
    PENDING: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      border: 'border-amber-500/20',
      label: 'Pending',
    },
    PROCESSED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/20',
      label: 'Processed',
    },
    PAID: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      border: 'border-emerald-500/20',
      label: 'Paid',
    },
    GENERATED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/20',
      label: 'Generated',
    },
    DOWNLOADED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      border: 'border-emerald-500/20',
      label: 'Downloaded',
    },
  };
  const style = config[status] || config.NOT_GENERATED;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
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
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-2xl p-6 hover:border-border transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-secondary rounded animate-pulse" />
      ) : (
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      )}
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

/* ─────────────────── Page ─────────────────── */

export default function SalarySlipsPage() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [previewData, setPreviewData] = useState<SlipPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() + 1 - i);

  /* ── Stats ── */
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['salary-slips-stats', selectedMonth, selectedYear],
    queryFn: async () => {
      const r = await api.get('/salary-slip/stats', { params: { month: selectedMonth, year: selectedYear } });
      return r.data?.data ?? r.data;
    },
  });

  /* ── Employee list with payroll status ── */
  const {
    data: employeesRaw,
    isLoading: empLoading,
    isError,
    refetch,
  } = useQuery<EmployeePayrollInfo[]>({
    queryKey: ['salary-slip-employees', selectedMonth, selectedYear, searchTerm, departmentFilter],
    queryFn: async () => {
      const r = await api.get('/salary-slip/employees', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          search: searchTerm || undefined,
          department: departmentFilter || undefined,
        },
      });
      return r.data?.data ?? r.data;
    },
  });
  const employees: EmployeePayrollInfo[] = Array.isArray(employeesRaw) ? employeesRaw : [];

  /* ── Departments ── */
  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const r = await api.get('/departments');
      return r.data?.data ?? r.data;
    },
  });

  /* ── Generate payroll mutation ── */
  const generatePayrollMut = useMutation({
    mutationFn: async ({ employeeDbId, month, year }: { employeeDbId: string; month: number; year: number }) => {
      const r = await api.post(`/payroll-processing/employee/${employeeDbId}`, { month, year });
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-slip-employees'] });
      queryClient.invalidateQueries({ queryKey: ['salary-slips-stats'] });
    },
    onError: (e: any) => {
      alert(e?.response?.data?.message || 'Failed to generate payroll');
    },
  });

  /* ── Generate salary slip (payslip) ── */
  const generateSlipMut = useMutation({
    mutationFn: async (payrollRunId: string) => {
      const r = await api.get(`/salary-slip/payroll/${payrollRunId}`);
      return r.data?.data ?? r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-slip-employees'] });
      queryClient.invalidateQueries({ queryKey: ['salary-slips-stats'] });
    },
  });

  /* ── Preview ── */
  const loadPreview = async (payrollRunId: string) => {
    try {
      const r = await api.get(`/salary-slip/payroll/${payrollRunId}`);
      const data = r.data?.data ?? r.data;
      setPreviewData(data);
      setShowPreview(true);
    } catch {
      alert('Failed to load salary slip preview');
    }
  };

  /* ── Download PDF ── */
  const downloadPdf = async (payrollRunId: string, empName: string) => {
    try {
      const r = await api.get(`/salary-slip/payroll/${payrollRunId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-slip-${empName.replace(/\s+/g, '-')}-${months[selectedMonth - 1]}-${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ['salary-slip-employees'] });
      queryClient.invalidateQueries({ queryKey: ['salary-slips-stats'] });
    } catch {
      alert('Failed to download PDF');
    }
  };

  /* ── Error state ── */
  if (isError) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-14 h-14 text-red-600" />
          <h2 className="font-heading text-xl font-bold text-foreground">Failed to load salary slips</h2>
          <p className="text-sm text-muted-foreground">Please try again later</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors">Retry</button>
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
            <h1 className="font-heading text-3xl font-extrabold text-foreground">Salary Slips</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate, manage, and distribute employee salary slips</p>
          </div>
          <button onClick={() => refetch()} disabled={empLoading} className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/50 text-foreground rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${empLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard title="Total Payroll Runs" value={stats?.totalSlips || 0} icon={<FileText className="w-6 h-6 text-blue-600" />} description={`${months[selectedMonth - 1]} ${selectedYear}`} loading={statsLoading} />
          <MetricCard title="Slips Generated" value={stats?.generatedSlips || 0} icon={<Clock className="w-6 h-6 text-amber-600" />} description="Payslip records" loading={statsLoading} />
          <MetricCard title="Downloaded" value={stats?.downloadedSlips || 0} icon={<DownloadCloud className="w-6 h-6 text-emerald-600" />} description="By HR/employees" loading={statsLoading} />
          <MetricCard title="Emailed" value={stats?.emailedSlips || 0} icon={<Send className="w-6 h-6 text-purple-600" />} description="Sent via email" loading={statsLoading} />
          <MetricCard title="Total Payroll" value={`₹${((stats?.totalPayroll || 0) / 100000).toFixed(1)}L`} icon={<DollarSign className="w-6 h-6 text-teal-400" />} description={`${months[selectedMonth - 1]} ${selectedYear}`} loading={statsLoading} />
          <MetricCard title="Avg Salary" value={`₹${((stats?.averageSalary || 0) / 1000).toFixed(0)}K`} icon={<Users className="w-6 h-6 text-rose-400" />} description="Per employee" loading={statsLoading} />
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name or Employee ID"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
              </div>
            </div>
            {/* Month */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Month</label>
              <div className="relative">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none cursor-pointer">
                  {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Year</label>
              <div className="relative">
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none cursor-pointer">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Department</label>
              <div className="relative">
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none cursor-pointer">
                  <option value="">All Departments</option>
                  {departments?.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Payroll Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">
              Employees &amp; Salary Slips ({employees.length})
            </h2>
          </div>

          {empLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <Users className="w-16 h-16 text-card-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                {searchTerm ? 'No employees found' : 'No employees to display'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchTerm
                  ? `No employee matches "${searchTerm}". Try searching by first name, last name, or employee ID.`
                  : 'Search for an employee or select a department to view payroll information.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {employees.map((emp, index) => (
                      <motion.tr
                        key={emp.employeeDbId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{emp.employeeName}</div>
                          <div className="text-sm text-muted-foreground">{emp.employeeId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-card-foreground">{emp.department}</div>
                          <div className="text-xs text-muted-foreground">{emp.designation}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-card-foreground">{months[selectedMonth - 1]} {selectedYear}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {emp.payrollStatus !== 'NOT_GENERATED' ? (
                            <div className="text-sm font-medium text-foreground">₹{emp.grossSalary.toLocaleString()}</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {emp.payrollStatus !== 'NOT_GENERATED' ? (
                            <div className="text-sm text-red-600">-₹{emp.deductions.toLocaleString()}</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {emp.payrollStatus !== 'NOT_GENERATED' ? (
                            <div className="text-sm font-bold text-emerald-600">₹{emp.netSalary.toLocaleString()}</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={emp.payrollStatus} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* NOT_GENERATED → Generate Payroll */}
                            {emp.payrollStatus === 'NOT_GENERATED' && (
                              <button
                                onClick={() => generatePayrollMut.mutate({ employeeDbId: emp.employeeDbId, month: selectedMonth, year: selectedYear })}
                                disabled={generatePayrollMut.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                title="Generate Payroll"
                              >
                                {generatePayrollMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Generate Payroll
                              </button>
                            )}

                            {/* Has payroll → Generate Slip if no payslip yet */}
                            {emp.payrollRunId && !emp.payslipId && (
                              <button
                                onClick={() => generateSlipMut.mutate(emp.payrollRunId!)}
                                disabled={generateSlipMut.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                title="Generate Salary Slip"
                              >
                                {generateSlipMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                Generate Slip
                              </button>
                            )}

                            {/* Has payroll → Preview */}
                            {emp.payrollRunId && (
                              <button
                                onClick={() => loadPreview(emp.payrollRunId!)}
                                className="p-2 hover:bg-secondary rounded-lg text-blue-600 hover:text-blue-300 transition-colors"
                                title="Preview Salary Slip"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {/* Has payroll → Download PDF */}
                            {emp.payrollRunId && (
                              <button
                                onClick={() => downloadPdf(emp.payrollRunId!, emp.employeeName)}
                                className="p-2 hover:bg-secondary rounded-lg text-emerald-600 hover:text-emerald-300 transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
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

      {/* ─── PREVIEW MODAL ─── */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">Salary Slip Preview</h2>
                <p className="text-xs text-muted-foreground">{previewData.payslipNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadPdf(previewData.payrollRunId, previewData.employee.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button onClick={() => { setShowPreview(false); setPreviewData(null); }} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-card text-foreground">
              {/* Company Header */}
              <div className="border-b border-border pb-4">
                <h3 className="text-2xl font-black tracking-tight text-foreground">FCS Firstclose Solution</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Human Resources & Payroll Department</p>
              </div>

              {/* Document Title Banner */}
              <div className="bg-secondary/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {previewData.title || (previewData.isFullAndFinal ? 'FULL & FINAL SETTLEMENT' : 'SALARY SLIP')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {previewData.period.monthName} {previewData.period.year}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground sm:text-right">
                  <p><span className="font-semibold text-foreground">Slip No:</span> {previewData.payslipNumber}</p>
                  <p><span className="font-semibold text-foreground">Generated:</span> {previewData.generatedAt ? new Date(previewData.generatedAt).toLocaleDateString('en-GB') : 'N/A'}</p>
                </div>
              </div>

              {/* Employee Information Section */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Employee Information
                </div>
                <div className="divide-y divide-border text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Employee Name:</span>
                      <span className="font-semibold text-foreground">{previewData.employee.name}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Joining Date:</span>
                      <span className="font-semibold text-foreground">
                        {previewData.employee.joiningDateFormatted || (previewData.employee.joiningDate ? new Date(previewData.employee.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A')}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border bg-secondary/10">
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Employee ID:</span>
                      <span className="font-mono font-semibold text-foreground">{previewData.employee.employeeId}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">End Date:</span>
                      <span className="font-semibold text-foreground">
                        {previewData.employee.endDateFormatted || (previewData.employee.endDate ? new Date(previewData.employee.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A')}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Designation:</span>
                      <span className="font-semibold text-foreground">{previewData.employee.designation || 'N/A'}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Pay Period:</span>
                      <span className="font-semibold text-foreground">{previewData.period.payPeriod || `${previewData.period.monthName} ${previewData.period.year}`}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border bg-secondary/10">
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Department:</span>
                      <span className="font-semibold text-foreground">{previewData.employee.department || 'N/A'}</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Email:</span>
                      <span className="text-foreground">{previewData.employee.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Details Section */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Salary Details
                </div>
                <div className="divide-y divide-border text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Monthly Salary:</span>
                      <span className="font-semibold text-foreground">
                        ₹{(previewData.salary?.monthlySalary ?? previewData.grossSalary ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Annual CTC / LPA:</span>
                      <span className="font-semibold text-foreground">
                        {previewData.salary?.annualCtcLpa || `₹${(((previewData.salary?.monthlySalary ?? previewData.grossSalary ?? 0) * 12) / 100000).toFixed(2)} LPA`}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border bg-secondary/10">
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">Previous / Last Salary:</span>
                      <span className="font-semibold text-foreground">
                        {previewData.salary?.previousSalary !== undefined && previewData.salary.previousSalary !== null
                          ? `₹${previewData.salary.previousSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span className="text-muted-foreground font-medium">
                        {previewData.isFullAndFinal ? 'Final Applicable Salary:' : 'Current Month Salary:'}
                      </span>
                      <span className="font-semibold text-foreground">
                        ₹{(previewData.salary?.currentMonthSalary ?? previewData.netSalary ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Payment Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border text-xs">
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Payment Status:</span>
                    <span className="font-semibold px-2.5 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      {previewData.payment?.status || (previewData.status === 'PAID' ? 'Paid' : previewData.status === 'PROCESSED' ? 'Processed' : 'Pending')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Payment Date:</span>
                    <span className="font-semibold text-foreground">
                      {previewData.payment?.paymentDate || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Payable Salary Highlight Box */}
              <div className="border-2 border-slate-900 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {previewData.isFullAndFinal ? 'Final Net Payable Salary' : 'Net Payable Salary / In-Hand'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Authorized payable amount</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    ₹{previewData.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Sign-off Block */}
              <div className="border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-secondary/10">
                <div>
                  <p className="text-[11px] text-muted-foreground">Authorized By:</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">FCS Firstclose Solution</p>
                  <p className="text-xs text-muted-foreground">HR Department</p>
                </div>
                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                  <div className="w-36 border-b border-muted-foreground/50 mb-1 ml-auto hidden sm:block"></div>
                  <p className="text-xs font-semibold text-muted-foreground">Authorized Signatory</p>
                </div>
              </div>

              {/* Footer text */}
              <p className="text-[10px] text-center text-muted-foreground pt-2">
                This is a computer-generated salary slip and does not require a physical signature.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </HRLayout>
  );
}
