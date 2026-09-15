'use client';

import React, { useState } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  PhoneCall,
  Briefcase,
  TrendingUp,
  FileText,
  Save,
  Check,
} from 'lucide-react';

export default function EmployeeTasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeTaskDetail, setActiveTaskDetail] = useState<any | null>(null);

  // Create Form State
  const [taskType, setTaskType] = useState<'TASK' | 'VISIT' | 'DAILY_ACTIVITY'>('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  // Visit fields
  const [visitCount, setVisitCount] = useState(1);
  const [visitClientName, setVisitClientName] = useState('');
  const [visitLocation, setVisitLocation] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitOutcome, setVisitOutcome] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [visitFollowUpDate, setVisitFollowUpDate] = useState('');
  const [visitFollowUpNotes, setVisitFollowUpNotes] = useState('');
  const [remarks, setRemarks] = useState('');

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['my-tasks-summary'],
    queryFn: async () => {
      const res = await api.get('/tasks/summary');
      return res.data?.data ?? res.data;
    },
  });

  // Fetch tasks
  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-tasks-list', search, selectedStatus, selectedClient, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedClient.trim()) params.append('client', selectedClient.trim());
      if (dateFilter) {
        params.append('startDate', dateFilter);
        params.append('endDate', dateFilter);
      }
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

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/tasks', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-summary'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.patch(`/tasks/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-summary'] });
      setEditingTask(null);
    },
  });

  // Quick Complete Mutation
  const quickCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/tasks/${id}`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-summary'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStatus('PENDING');
    setTaskType('TASK');
    setVisitCount(1);
    setVisitClientName('');
    setVisitLocation('');
    setVisitPurpose('');
    setVisitOutcome('');
    setFollowUpRequired(false);
    setVisitFollowUpDate('');
    setVisitFollowUpNotes('');
    setRemarks('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMutation.mutate({
      taskType,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      activityDate: activityDate || undefined,
      dueDate: dueDate || undefined,
      visitCount: taskType === 'VISIT' ? Number(visitCount) : undefined,
      visitClientName: taskType === 'VISIT' ? visitClientName.trim() || undefined : undefined,
      visitLocation: taskType === 'VISIT' ? visitLocation.trim() || undefined : undefined,
      visitPurpose: taskType === 'VISIT' ? visitPurpose.trim() || undefined : undefined,
      visitOutcome: visitOutcome.trim() || undefined,
      followUpRequired: taskType === 'VISIT' ? followUpRequired : undefined,
      visitFollowUpDate:
        taskType === 'VISIT' && followUpRequired && visitFollowUpDate ? visitFollowUpDate : undefined,
      visitFollowUpNotes:
        taskType === 'VISIT' && followUpRequired ? visitFollowUpNotes.trim() || undefined : undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateMutation.mutate({
      id: editingTask.id,
      payload: {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        visitCount: editingTask.visitCount ? Number(editingTask.visitCount) : undefined,
        visitClientName: editingTask.visitClientName,
        visitLocation: editingTask.visitLocation,
        visitOutcome: editingTask.visitOutcome,
        remarks: editingTask.remarks,
        visitFollowUpDate: editingTask.visitFollowUpDate || undefined,
        visitFollowUpNotes: editingTask.visitFollowUpNotes || undefined,
      },
    });
  };

  return (
    <ProtectedRoute allowedRoles={['EMPLOYEE']} redirectTo="/login">
      <EmployeeLayout>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  My Tasks & Work Activity
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Log daily tasks, field visits, client follow-ups, and track your work outcomes.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 w-fit"
            >
              <Plus className="w-4 h-4" />
              Add Task / Visit / Activity
            </button>
          </div>

          {/* Today & Overall KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today's Activities
                </span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {summary.today?.activities || 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({summary.today?.completed || 0} done)
                </span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Total Completed
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {summary.completedActivities}
                </span>
                <span className="text-xs text-muted-foreground">tasks finished</span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Pending / In Progress
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {summary.pendingActivities + summary.inProgressActivities}
                </span>
                <span className="text-xs text-muted-foreground">in pipeline</span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Visits Recorded
                </span>
                <MapPin className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-600">
                  {summary.totalVisits}
                </span>
                <span className="text-xs text-muted-foreground">client visits</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search your tasks, client, or outcome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="sm:w-40">
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

              <div className="sm:w-44">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  title="Filter by Activity Date"
                />
              </div>

              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-muted-foreground hover:text-foreground underline px-2 py-1"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Activity History List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-muted-foreground mt-3 font-medium">Loading your activities...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-sm font-semibold text-foreground">Failed to load activity history</p>
                <p className="text-xs text-muted-foreground">{(error as any)?.message}</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-14 h-14 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mx-auto">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-foreground">No tasks or activities found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  You haven't logged any work activities yet. Click below to add your first task or field visit.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Task / Activity</th>
                      <th className="px-6 py-3.5">Visits</th>
                      <th className="px-6 py-3.5">Client</th>
                      <th className="px-6 py-3.5">Result / Outcome</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tasks.map((task: any) => {
                      const actDate = task.activityDate
                        ? new Date(task.activityDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={task.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {actDate}
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              <span>{task.title}</span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  task.priority === 'HIGH' || task.priority === 'URGENT'
                                    ? 'bg-red-500/10 text-red-600'
                                    : task.priority === 'MEDIUM'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {task.taskType === 'VISIT' || task.visitCount ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600">
                                <MapPin className="w-3 h-3" />
                                {task.visitCount || 1}
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
                                  <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
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
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                task.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : task.status === 'CANCELLED'
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {task.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {task.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => quickCompleteMutation.mutate(task.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  title="Mark Completed"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                title="Edit / Update Outcome"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setActiveTaskDetail(task)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CREATE TASK / VISIT / ACTIVITY MODAL */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Log Work Activity / Task / Visit</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Record field visits, daily tasks, client interactions, and progress.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                  {/* Type Selector */}
                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Activity Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskType('TASK')}
                        className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                          taskType === 'TASK'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-background border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        General Task
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskType('VISIT')}
                        className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                          taskType === 'VISIT'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-background border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        Field / Client Visit
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskType('DAILY_ACTIVITY')}
                        className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                          taskType === 'DAILY_ACTIVITY'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-background border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        Daily Work Log
                      </button>
                    </div>
                  </div>

                  {/* Title & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Title / Activity Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Client Follow-up, Market Visit"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Activity Date
                      </label>
                      <input
                        type="date"
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Priority & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Visit Section if applicable */}
                  {taskType === 'VISIT' && (
                    <div className="p-4 bg-secondary/40 border border-border rounded-xl space-y-3">
                      <span className="font-bold text-xs text-blue-600 block">
                        📍 Field Visit Specific Details
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-muted-foreground font-medium mb-1">
                            Client / Company Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. ABC Company"
                            value={visitClientName}
                            onChange={(e) => setVisitClientName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-muted-foreground font-medium mb-1">
                            Visit Location
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sector 62, Noida"
                            value={visitLocation}
                            onChange={(e) => setVisitLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-muted-foreground font-medium mb-1">
                            Visit Count
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={visitCount}
                            onChange={(e) => setVisitCount(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-muted-foreground font-medium mb-1">
                          Purpose of Visit
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Client Follow-up, Product Demo, Contract discussion"
                          value={visitPurpose}
                          onChange={(e) => setVisitPurpose(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                        />
                      </div>

                      {/* Follow up toggle */}
                      <div className="pt-2 border-t border-border">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={followUpRequired}
                            onChange={(e) => setFollowUpRequired(e.target.checked)}
                            className="rounded border-border text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-foreground">Follow-up Required</span>
                        </label>

                        {followUpRequired && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-muted-foreground font-medium mb-1">
                                Follow-up Date
                              </label>
                              <input
                                type="date"
                                value={visitFollowUpDate}
                                onChange={(e) => setVisitFollowUpDate(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                              />
                            </div>
                            <div>
                              <label className="block text-muted-foreground font-medium mb-1">
                                Follow-up Notes
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Share revised commercial proposal"
                                value={visitFollowUpNotes}
                                onChange={(e) => setVisitFollowUpNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Outcome / Result */}
                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Outcome / Result
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 2 clients interested, lead generated, contract signed..."
                      value={visitOutcome}
                      onChange={(e) => setVisitOutcome(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>

                  {/* Description / Remarks */}
                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Description / Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Additional notes, activities performed..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 border border-border font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Saving...' : 'Save Activity'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT TASK / OUTCOME MODAL */}
          {editingTask && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Update Task / Activity</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Record final outcome, change status, or add notes.
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={editingTask.status}
                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Priority
                      </label>
                      <select
                        value={editingTask.priority}
                        onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {editingTask.taskType === 'VISIT' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-muted-foreground font-medium mb-1">
                          Client Name
                        </label>
                        <input
                          type="text"
                          value={editingTask.visitClientName || ''}
                          onChange={(e) =>
                            setEditingTask({ ...editingTask, visitClientName: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-foreground font-medium mb-1">
                          Visits Made
                        </label>
                        <input
                          type="number"
                          value={editingTask.visitCount || 1}
                          onChange={(e) =>
                            setEditingTask({ ...editingTask, visitCount: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Outcome / Result Achieved
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Proposal accepted, follow-up scheduled for next week..."
                      value={editingTask.visitOutcome || ''}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, visitOutcome: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Notes / Description
                    </label>
                    <textarea
                      rows={2}
                      value={editingTask.description || ''}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, description: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="px-4 py-2 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 border border-border font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Updating...' : 'Update Activity'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW DETAIL MODAL */}
          {activeTaskDetail && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Activity Details
                    </span>
                    <h2 className="text-lg font-bold text-foreground mt-0.5">
                      {activeTaskDetail.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTaskDetail(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-semibold text-foreground">
                      {activeTaskDetail.activityDate
                        ? new Date(activeTaskDetail.activityDate).toLocaleDateString('en-GB')
                        : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-bold text-foreground">{activeTaskDetail.status}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="font-bold text-foreground">{activeTaskDetail.priority}</span>
                  </div>

                  {activeTaskDetail.visitClientName && (
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-bold text-foreground">
                        {activeTaskDetail.visitClientName}
                      </span>
                    </div>
                  )}

                  {activeTaskDetail.visitLocation && (
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-semibold text-foreground">
                        {activeTaskDetail.visitLocation}
                      </span>
                    </div>
                  )}

                  {activeTaskDetail.visitOutcome && (
                    <div className="py-2">
                      <span className="text-muted-foreground block mb-1 font-semibold">Outcome:</span>
                      <p className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-foreground">
                        {activeTaskDetail.visitOutcome}
                      </p>
                    </div>
                  )}

                  {activeTaskDetail.description && (
                    <div className="py-1">
                      <span className="text-muted-foreground block mb-1">Notes:</span>
                      <p className="text-foreground">{activeTaskDetail.description}</p>
                    </div>
                  )}
                </div>

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
      </EmployeeLayout>
    </ProtectedRoute>
  );
}
