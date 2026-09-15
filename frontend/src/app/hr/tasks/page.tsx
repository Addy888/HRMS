'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Building2,
  Users,
  Search,
  Filter,
  Eye,
  ChevronRight,
  TrendingUp,
  Briefcase,
  X,
  FileText,
  PhoneCall,
} from 'lucide-react';

export default function HREmployeeActivityPage() {
  const [selectedEmployee, setSelectedEmployee] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTaskDetail, setActiveTaskDetail] = useState<any | null>(null);

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data?.data ?? res.data ?? [];
    },
  });

  // Fetch employees list for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-simple-list'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=100');
      return res.data?.data?.employees ?? res.data?.employees ?? res.data ?? [];
    },
  });

  // Fetch activity summary metrics
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['tasks-summary', selectedEmployee, selectedDept],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmployee !== 'ALL') params.append('employeeId', selectedEmployee);
      if (selectedDept !== 'ALL') params.append('departmentId', selectedDept);
      const res = await api.get(`/tasks/summary?${params.toString()}`);
      return res.data?.data ?? res.data;
    },
  });

  // Fetch tasks list
  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: [
      'tasks-list',
      selectedEmployee,
      selectedDept,
      selectedStatus,
      selectedPriority,
      selectedType,
      search,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmployee !== 'ALL') params.append('employeeId', selectedEmployee);
      if (selectedDept !== 'ALL') params.append('departmentId', selectedDept);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);
      if (selectedType !== 'ALL') params.append('taskType', selectedType);
      if (search.trim()) params.append('search', search.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '50');

      const res = await api.get(`/tasks?${params.toString()}`);
      return res.data?.data ?? res.data;
    },
  });

  const summary = summaryData ?? {
    totalActivities: 0,
    completedActivities: 0,
    pendingActivities: 0,
    inProgressActivities: 0,
    totalVisits: 0,
    activitiesThisWeek: 0,
    today: { activities: 0, completed: 0, pending: 0, visits: 0 },
  };

  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const departments = Array.isArray(departmentsData) ? departmentsData : [];
  const employeesList = Array.isArray(employeesData) ? employeesData : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-red-500/10 text-red-600 border border-red-500/20">
            {priority}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-secondary text-muted-foreground">
            LOW
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_USER', 'HR']} redirectTo="/login">
      <HRLayout>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  Employee Activity & Visit Tracking
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Monitor field visits, customer interactions, daily work accomplishments, and team performance.
              </p>
            </div>
          </div>

          {/* KPI Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Activities
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {summary.totalActivities}
                </span>
                <span className="text-xs text-muted-foreground">all-time</span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Completed
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {summary.completedActivities}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Pending
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {summary.pendingActivities}
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Total Visits
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {summary.totalVisits}
                </span>
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                This Week
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {summary.activitiesThisWeek}
                </span>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Employee selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="ALL">All Employees</option>
                  {employeesList.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Priority selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Row 2: Search + Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search task, client, location, outcome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="From Date"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="To Date"
                />
              </div>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-muted-foreground mt-3 font-medium">Loading activities...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-sm font-semibold text-foreground">Failed to load employee activities</p>
                <p className="text-xs text-muted-foreground">{(error as any)?.message}</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mx-auto">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-foreground">No activities found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No employee work activities or client visits match the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Activity / Task</th>
                      <th className="px-6 py-3.5">Visits</th>
                      <th className="px-6 py-3.5">Client / Location</th>
                      <th className="px-6 py-3.5">Outcome / Result</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tasks.map((task: any) => {
                      const emp = task.employee;
                      const actDate = task.activityDate
                        ? new Date(task.activityDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={task.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">
                              {emp?.firstName} {emp?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="font-mono">{emp?.employeeId}</span>
                              <span>•</span>
                              <span>{emp?.department?.name || 'VPT'}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {actDate}
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              <span>{task.title}</span>
                              {getPriorityBadge(task.priority)}
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {task.taskType === 'VISIT' || task.visitCount ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                <MapPin className="w-3 h-3" />
                                {task.visitCount || 1} {task.visitCount === 1 ? 'visit' : 'visits'}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {task.visitClientName ? (
                              <div>
                                <span className="font-semibold text-foreground text-xs">
                                  {task.visitClientName}
                                </span>
                                {task.visitLocation && (
                                  <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                    {task.visitLocation}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {task.visitOutcome ? (
                              <span className="text-xs text-foreground font-medium block truncate max-w-[200px]">
                                {task.visitOutcome}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Pending outcome</span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(task.status)}
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setActiveTaskDetail(task)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Task Detail Modal */}
          {activeTaskDetail && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {activeTaskDetail.taskType} Detail
                    </span>
                    <h2 className="text-lg font-bold text-foreground mt-0.5">
                      {activeTaskDetail.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTaskDetail(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Employee Context */}
                <div className="bg-secondary/40 border border-border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Employee:</span>
                    <p className="font-bold text-sm text-foreground">
                      {activeTaskDetail.employee?.firstName} {activeTaskDetail.employee?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Employee ID:</span>
                    <p className="font-mono font-semibold text-xs text-foreground">
                      {activeTaskDetail.employee?.employeeId}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Department:</span>
                    <p className="font-semibold text-xs text-foreground">
                      {activeTaskDetail.employee?.department?.name || 'VPT'}
                    </p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">Status</span>
                    <div className="mt-1">{getStatusBadge(activeTaskDetail.status)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Priority</span>
                    <div className="mt-1">{getPriorityBadge(activeTaskDetail.priority)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Activity Date</span>
                    <p className="mt-1 font-semibold text-foreground">
                      {activeTaskDetail.activityDate
                        ? new Date(activeTaskDetail.activityDate).toLocaleDateString('en-GB')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Visits Recorded</span>
                    <p className="mt-1 font-semibold text-foreground">
                      {activeTaskDetail.visitCount || 1} visit(s)
                    </p>
                  </div>
                </div>

                {/* Visit info if applicable */}
                {activeTaskDetail.visitClientName && (
                  <div className="bg-secondary/30 rounded-xl p-3.5 space-y-2 text-xs border border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client Name:</span>
                      <span className="font-bold text-foreground">
                        {activeTaskDetail.visitClientName}
                      </span>
                    </div>
                    {activeTaskDetail.visitLocation && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-semibold text-foreground">
                          {activeTaskDetail.visitLocation}
                        </span>
                      </div>
                    )}
                    {activeTaskDetail.visitPurpose && (
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Purpose:</span>
                        <p className="text-foreground bg-background/50 p-2 rounded border border-border">
                          {activeTaskDetail.visitPurpose}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Outcome */}
                {activeTaskDetail.visitOutcome && (
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-foreground">Outcome / Result:</span>
                    <p className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-foreground rounded-xl">
                      {activeTaskDetail.visitOutcome}
                    </p>
                  </div>
                )}

                {/* Follow up if any */}
                {activeTaskDetail.followUpRequired && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-600">
                      <span>Follow-up Required: Yes</span>
                      {activeTaskDetail.visitFollowUpDate && (
                        <span>
                          Follow-up Date:{' '}
                          {new Date(activeTaskDetail.visitFollowUpDate).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                    {activeTaskDetail.visitFollowUpNotes && (
                      <p className="text-muted-foreground text-[11px]">
                        Notes: {activeTaskDetail.visitFollowUpNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Description & Remarks */}
                {activeTaskDetail.description && (
                  <div className="text-xs space-y-1">
                    <span className="text-muted-foreground font-medium">Description:</span>
                    <p className="text-foreground">{activeTaskDetail.description}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    onClick={() => setActiveTaskDetail(null)}
                    className="px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 border border-border"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </HRLayout>
    </ProtectedRoute>
  );
}
