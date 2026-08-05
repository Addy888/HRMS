'use client';

import React from 'react';
import HRLayout from '@/layouts/HRLayout';
import { MetricCard } from '@/components/MetricCard';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock, 
  FileText, 
  AlertCircle, 
  Layers, 
  Award,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function HRDashboard() {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hr-dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/hr');
      // TransformInterceptor wraps: { success, statusCode, data: <actual payload> }
      return response.data?.data ?? response.data;
    },
    retry: 1,
  });

  const cardsData = [
    { title: 'Total Employees', value: stats?.cards?.totalEmployees || 0, icon: <Users className="w-5 h-5" />, desc: 'Corporate workforce directory size' },
    { title: 'Active Employees', value: stats?.cards?.activeEmployees || 0, icon: <UserCheck className="w-5 h-5 text-emerald-400" />, desc: 'System-enabled directory accounts' },
    { title: 'Inactive Employees', value: stats?.cards?.inactiveEmployees || 0, icon: <UserMinus className="w-5 h-5 text-neutral-500" />, desc: 'Revoked/deactivated directory users' },
    { title: 'Pending Onboarding', value: stats?.cards?.pendingOnboarding || 0, icon: <Clock className="w-5 h-5 text-amber-400" />, desc: 'Pending document / policy signing' },
    { title: 'Completed Onboarding', value: stats?.cards?.completedOnboarding || 0, icon: <Briefcase className="w-5 h-5 text-indigo-400" />, desc: 'Verified and activated employee profiles' },
    { title: 'Pending Documents', value: stats?.cards?.pendingDocuments || 0, icon: <FileText className="w-5 h-5 text-purple-400" />, desc: 'Uploaded documents waiting HR review' },
    { title: 'Pending Complaints', value: stats?.cards?.pendingComplaints || 0, icon: <AlertCircle className="w-5 h-5 text-rose-400" />, desc: 'Open tickets awaiting resolution' },
    { title: 'Departments', value: stats?.cards?.totalDepartments || 0, icon: <Layers className="w-5 h-5 text-sky-400" />, desc: 'Registered organizational departments' },
    { title: 'Designations', value: stats?.cards?.totalDesignations || 0, icon: <Award className="w-5 h-5 text-teal-400" />, desc: 'Registered company-wide job titles' },
  ];

  if (isError) {
    const errMsg = (error as any)?.message || 'Failed to load HR dashboard data from API.';
    return (
      <HRLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="font-heading text-xl font-bold text-white">Dashboard API Error</h2>
          <p className="text-sm text-neutral-400 max-w-md text-center">{errMsg}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Dashboard Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white">HR Panel Overview</h1>
          <p className="text-sm text-neutral-400">
            Real-time FCS human resources metrics, onboarding stats, recent logs, and administrative widgets.
          </p>
        </div>

        {/* Dashboard Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardsData.map((card, i) => (
            <MetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.desc}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Recent Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Joined */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Recently Joined Employees
              </h2>
              <Link href="/hr/employees" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-14 bg-neutral-900 animate-pulse rounded-xl" />
                ))
              ) : stats?.recentlyJoined?.length > 0 ? (
                stats.recentlyJoined.map((emp: any) => (
                  <div key={emp.id} className="flex justify-between items-center p-3 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/40 rounded-xl transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-heading text-xs font-bold text-white uppercase">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{emp.firstName} {emp.lastName}</h4>
                        <span className="text-xs text-neutral-400">{emp.designation?.name || 'N/A'} • {emp.department?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono bg-neutral-800 border border-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-medium">
                        {emp.employeeId}
                      </span>
                      <p className="text-[10px] text-neutral-500 mt-1 font-medium">
                        Joined {new Date(emp.joiningDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-500 text-sm">No recently joined records found.</div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent HR Action Logs
            </h2>

            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-14 bg-neutral-900 animate-pulse rounded-xl" />
                ))
              ) : stats?.recentActivities?.length > 0 ? (
                stats.recentActivities.map((act: any) => (
                  <div key={act.id} className="p-3 bg-neutral-900/50 border border-neutral-800/40 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 font-medium">{act.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-500 text-sm">No administrative logs recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}
