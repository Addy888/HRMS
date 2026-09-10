'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import SalaryStructureForm from '@/components/SalaryStructureForm';

// Types
interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  template: string | null;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  netSalary: number;
  ctc: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  name: string;
}

interface DashboardStats {
  totalEmployees: number;
  configuredStructures: number;
  pendingConfiguration: number;
  averageCTC: number;
}

export default function SalaryStructurePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['salary-structure-stats'],
    queryFn: async () => {
      const response = await api.get('/salary-structure/dashboard/stats');
      return response.data;
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

  // Fetch designations
  const { data: designations } = useQuery<Designation[]>({
    queryKey: ['designations'],
    queryFn: async () => {
      const response = await api.get('/designations');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  // Fetch salary structures
  const {
    data: structures,
    isLoading,
    isError,
    refetch,
  } = useQuery<SalaryStructure[]>({
    queryKey: ['salary-structures', searchTerm, departmentFilter, designationFilter, statusFilter],
    queryFn: async () => {
      const response = await api.get('/salary-structure', {
        params: {
          search: searchTerm || undefined,
          departmentId: departmentFilter || undefined,
          designationId: designationFilter || undefined,
          isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        },
      });
      return response.data?.data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/salary-structure/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structure-stats'] });
      alert('Salary structure deleted successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete');
    },
  });

  const handleDelete = (id: string, employeeName: string) => {
    if (window.confirm(`Delete salary structure for ${employeeName}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (structure: SalaryStructure) => {
    setSelectedStructure(structure);
    setShowCreateDrawer(true);
  };

  const handleDuplicate = (structure: SalaryStructure) => {
    const duplicate = { ...structure, id: '', employeeId: '', employeeName: '' };
    setSelectedStructure(duplicate);
    setShowCreateDrawer(true);
  };

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Configured',
      value: stats?.configuredStructures || 0,
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Pending',
      value: stats?.pendingConfiguration || 0,
      icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Average CTC',
      value: `₹${((stats?.averageCTC || 0) / 100000).toFixed(2)}L`,
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  if (isLoading) {
    return (
      <HRLayout>
        <div className="space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-secondary rounded-lg w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-secondary rounded-xl" />
          </div>
        </div>
      </HRLayout>
    );
  }

  if (isError) {
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="w-14 h-14 text-red-600 mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground">Failed to load data</h2>
          <p className="text-sm text-muted-foreground mt-2">Please try again</p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-foreground rounded-lg"
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                Salary Structure
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure employee salary templates, earnings, deductions and compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-secondary border border-border hover:border-border text-foreground rounded-lg flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="px-4 py-2 bg-secondary border border-border hover:border-border text-foreground rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                setSelectedStructure(null);
                setShowCreateDrawer(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-foreground rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Create Salary Structure
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
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-border transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
              <div className="text-sm text-muted-foreground">{card.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {(departments || []).map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Designation Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">All Designations</option>
                {(designations || []).map((desig) => (
                  <option key={desig.id} value={desig.id}>{desig.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {!structures || structures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <FileText className="w-16 h-16 text-card-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No salary structures found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchTerm || departmentFilter || designationFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first salary structure to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Basic
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      HRA
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Effective
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {structures.map((structure, index) => (
                    <motion.tr
                      key={structure.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {structure.employeeName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {structure.employeeCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-card-foreground">{structure.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-card-foreground">{structure.designation}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-card-foreground">
                          ₹{structure.basicSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-card-foreground">
                          ₹{structure.hra.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-foreground">
                          ₹{structure.grossSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-emerald-600">
                          ₹{structure.netSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(structure.effectiveFrom).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {structure.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background0/10 text-muted-foreground border border-neutral-500/20">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(structure)}
                            className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors group"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground group-hover:text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(structure)}
                            className="p-1.5 hover:bg-amber-500/10 rounded-lg transition-colors group"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground group-hover:text-amber-600" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(structure)}
                            className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors group"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground group-hover:text-purple-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(structure.id, structure.employeeName)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-600" />
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
      </div>

      {/* Create/Edit Drawer */}
      {showCreateDrawer && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <div className="fixed right-0 top-0 h-full w-full max-w-5xl bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/80">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedStructure?.id ? 'Edit Salary Structure' : 'Create Salary Structure'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure earnings, deductions, and employer contributions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateDrawer(false);
                    setSelectedStructure(null);
                  }}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors group"
                >
                  <svg className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <SalaryStructureForm
                initialData={selectedStructure}
                onSuccess={() => {
                  setShowCreateDrawer(false);
                  setSelectedStructure(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowCreateDrawer(false);
                  setSelectedStructure(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
}
