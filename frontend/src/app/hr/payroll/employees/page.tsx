'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HRLayout from '@/layouts/HRLayout';
import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';

// Types
interface EmployeeSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  departmentId: string | null;
  designation: string;
  designationId: string | null;
  monthlySalary: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  netSalary: number;
  status: 'ACTIVE' | 'NOT_CONFIGURED';
  salaryStructureId: string | null;
  effectiveFrom: string | null;
  ctc: number;
}

interface Department {
  id: string;
  name: string;
}

export default function EmployeeSalaryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch departments for filter
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      // Handle both array response and {data: array} response
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  // Fetch employee salary list
  const {
    data: salaryData,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ success: boolean; data: EmployeeSalary[]; meta: any }>({
    queryKey: ['employee-salary-list', searchTerm, departmentFilter, currentPage],
    queryFn: async () => {
      const response = await api.get('/salary-structure/list', {
        params: {
          search: searchTerm || undefined,
          department: departmentFilter || undefined,
          page: currentPage,
          limit: pageSize,
        },
      });
      return response.data;
    },
  });

  const employees = salaryData?.data || [];
  const totalPages = salaryData?.meta?.totalPages || 1;
  const totalEmployees = salaryData?.meta?.total || 0;

  // Delete salary structure mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/salary-structure/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-list'] });
      alert('Salary structure deleted successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete salary structure');
    },
  });

  const handleDelete = (id: string, employeeName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the salary structure for ${employeeName}?`
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDepartmentFilter = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <HRLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                Employee Salary Management
              </h1>
              <p className="text-sm text-neutral-400">
                View and manage employee salary structures
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-neutral-900 rounded-lg" />
              <div className="h-64 bg-neutral-900 rounded-lg" />
            </div>
          </div>
        </div>
      </HRLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="w-14 h-14 text-red-400" />
          <h2 className="font-heading text-xl font-bold text-white mt-4">
            Failed to load employee salaries
          </h2>
          <p className="text-sm text-neutral-400 mt-2">Please try again later</p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">
                Employee Salary Management
              </h1>
              <p className="text-sm text-neutral-400">
                View and manage employee salary structures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">
              Total: <span className="text-white font-semibold">{totalEmployees}</span>{' '}
              employees
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter */}
            <div className="relative lg:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilter(e.target.value)}
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
          </div>
        </div>

        {/* Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <DollarSign className="w-16 h-16 text-neutral-700 mb-4" />
              <h3 className="font-semibold text-white mb-2">No employees found</h3>
              <p className="text-sm text-neutral-500 text-center max-w-sm">
                {searchTerm || departmentFilter
                  ? 'Try adjusting your filters'
                  : 'No employees with salary structures configured yet'}
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Basic
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        HRA
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Special
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Gross
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
                    {employees.map((employee, index) => (
                      <motion.tr
                        key={employee.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-neutral-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {employee.employeeName}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {employee.employeeId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {employee.department}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {employee.designation}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-neutral-300">
                            ₹{employee.basicSalary.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-neutral-300">
                            ₹{employee.hra.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-neutral-300">
                            ₹{employee.specialAllowance.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-white">
                            ₹{employee.grossSalary.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-emerald-400">
                            ₹{employee.netSalary.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {employee.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                              Not Configured
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {employee.salaryStructureId ? (
                              <>
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/hr/payroll/salary-structure/${employee.salaryStructureId}`,
                                      '_blank'
                                    )
                                  }
                                  className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors group"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-neutral-400 group-hover:text-blue-400" />
                                </button>
                                <button
                                  onClick={() =>
                                    (window.location.href = `/hr/payroll/salary-structure/${employee.salaryStructureId}/edit`)
                                  }
                                  className="p-1.5 hover:bg-amber-500/10 rounded-lg transition-colors group"
                                  title="Edit Salary"
                                >
                                  <Edit className="w-4 h-4 text-neutral-400 group-hover:text-amber-400" />
                                </button>
                                <button
                                  onClick={() =>
                                    (window.location.href = `/hr/employees/${employee.id}?tab=payslips`)
                                  }
                                  className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors group"
                                  title="Generate Salary Slip"
                                >
                                  <FileText className="w-4 h-4 text-neutral-400 group-hover:text-purple-400" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      employee.salaryStructureId!,
                                      employee.employeeName
                                    )
                                  }
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-neutral-400 group-hover:text-red-400" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  router.push(`/hr/payroll/salary-structure/new?employeeId=${employee.id}`)
                                }
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                              >
                                Configure
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between">
                  <div className="text-sm text-neutral-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutral-400" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </HRLayout>
  );
}
