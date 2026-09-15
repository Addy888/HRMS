'use client';

import React, { useState } from 'react';
import HRLayout from '@/layouts/HRLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Cake,
  Calendar,
  Search,
  Filter,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  PartyPopper,
  Clock,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function HRBirthdaysPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'this-week' | 'this-month' | 'upcoming'>('upcoming');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Fetch departments for filter
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data?.data ?? res.data ?? [];
    },
  });

  // Fetch birthdays
  const {
    data: birthdaysData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employee-birthdays', activeTab, selectedDept, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('filter', activeTab);
      if (selectedDept && selectedDept !== 'ALL') {
        params.append('departmentId', selectedDept);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }
      const res = await api.get(`/employees/birthdays?${params.toString()}`);
      return res.data?.data ?? res.data;
    },
  });

  const employees = birthdaysData?.data ?? [];
  const counts = birthdaysData?.counts ?? {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalUpcoming: 0,
  };

  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  return (
    <ProtectedRoute allowedRoles={['HR_ADMIN', 'HR_USER', 'HR']} redirectTo="/login">
      <HRLayout>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 text-pink-500">
                  <Cake className="w-6 h-6" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  Employee Birthdays
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Track upcoming birthdays, celebrate employee milestones, and foster team appreciation.
              </p>
            </div>

            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl transition-all shadow-sm w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Metric highlight pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('today')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'today'
                  ? 'bg-pink-500/10 border-pink-500/40 ring-2 ring-pink-500/20'
                  : 'bg-card border-border hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today
                </span>
                <PartyPopper className="w-4 h-4 text-pink-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{counts.today}</span>
                <span className="text-xs text-pink-500 font-medium">🎂 Celebration</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('this-week')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'this-week'
                  ? 'bg-blue-500/10 border-blue-500/40 ring-2 ring-blue-500/20'
                  : 'bg-card border-border hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  This Week
                </span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{counts.thisWeek}</span>
                <span className="text-xs text-muted-foreground">Next 7 days</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('this-month')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'this-month'
                  ? 'bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20'
                  : 'bg-card border-border hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  This Month
                </span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{counts.thisMonth}</span>
                <span className="text-xs text-muted-foreground">In current month</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('upcoming')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                  : 'bg-card border-border hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  All Upcoming
                </span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{counts.totalUpcoming}</span>
                <span className="text-xs text-muted-foreground">Chronological</span>
              </div>
            </div>
          </div>

          {/* Search, Department filter & View toggle bar */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by employee name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Department Dropdown */}
              <div className="sm:w-56">
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
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-secondary/50 self-end md:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-all ${
                  viewMode === 'table'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-xl">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-muted-foreground mt-3 font-medium">Loading employee birthdays...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center bg-card border border-destructive/20 rounded-xl space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-foreground">Failed to load birthdays</p>
              <p className="text-xs text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred.'}
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl space-y-3">
              <div className="w-14 h-14 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Cake className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">No birthdays found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No employee birthdays match the selected criteria or timeframe. Ensure employees have DOB
                configured in their profile.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {employees.map((emp: any) => {
                const isToday = emp.isToday;
                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();

                return (
                  <div
                    key={emp.id}
                    className={`relative bg-card rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                      isToday
                        ? 'border-pink-500/50 ring-2 ring-pink-500/20 bg-gradient-to-br from-pink-500/5 via-card to-card'
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    {/* Today Banner */}
                    {isToday && (
                      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 px-4 py-1.5 text-white flex items-center justify-between text-xs font-bold tracking-wide">
                        <span className="flex items-center gap-1.5">
                          🎂 Birthday Today!
                        </span>
                        <PartyPopper className="w-4 h-4 animate-bounce" />
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      {/* Top row: Avatar + Name + ID */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden ${
                              isToday
                                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}
                          >
                            {emp.photoUrl ? (
                              <img
                                src={emp.photoUrl}
                                alt={emp.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-base text-foreground group-hover:text-primary">
                              {emp.fullName}
                            </h3>
                            <span className="inline-block text-xs font-mono font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded mt-0.5">
                              {emp.employeeId}
                            </span>
                          </div>
                        </div>

                        {/* Days Remaining Pill */}
                        {!isToday && (
                          <div
                            className={`text-right px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              emp.daysRemaining <= 7
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {emp.daysRemaining === 1
                              ? 'Tomorrow'
                              : `${emp.daysRemaining} days left`}
                          </div>
                        )}
                      </div>

                      {/* Info lines */}
                      <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Department:
                          </span>
                          <span className="font-semibold text-foreground">
                            {emp.department}
                          </span>
                        </div>

                        {emp.designation && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Role / Designation:</span>
                            <span className="font-semibold text-foreground">
                              {emp.designation}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5 text-pink-500 font-medium">
                            <Cake className="w-3.5 h-3.5" />
                            Birthday:
                          </span>
                          <span className="font-bold text-foreground text-sm">
                            {emp.birthdayFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Profile Link */}
                      <div className="pt-2">
                        <Link
                          href={`/hr/employees/${emp.id}`}
                          className="flex items-center justify-center gap-1.5 w-full py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl transition-all border border-border"
                        >
                          View Profile
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Employee ID</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Birthday Date</th>
                      <th className="px-6 py-3.5">Days Remaining</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.map((emp: any) => (
                      <tr
                        key={emp.id}
                        className={`hover:bg-secondary/20 transition-colors ${
                          emp.isToday ? 'bg-pink-500/5' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                                emp.isToday
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {`${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold">{emp.fullName}</div>
                              {emp.designation && (
                                <div className="text-xs text-muted-foreground">
                                  {emp.designation}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground">
                          {emp.employeeId}
                        </td>
                        <td className="px-6 py-4 text-foreground">{emp.department}</td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Cake className="w-4 h-4 text-pink-500" />
                            {emp.birthdayFormatted}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {emp.isToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-500 text-white">
                              🎂 Birthday Today!
                            </span>
                          ) : (
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                emp.daysRemaining <= 7
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              {emp.daysRemaining === 1
                                ? '1 day remaining'
                                : `${emp.daysRemaining} days remaining`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/hr/employees/${emp.id}`}
                            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Profile
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </HRLayout>
    </ProtectedRoute>
  );
}
