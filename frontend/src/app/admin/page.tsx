'use client';

import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Shield, Users, UserCog, FileText, Activity, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = [
    {
      icon: <UserCog className="w-6 h-6 text-blue-600" />,
      label: 'Total HR Accounts',
      value: '0',
      trend: '+0 this month',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      label: 'Total Employees',
      value: '0',
      trend: '+0 this month',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      icon: <Activity className="w-6 h-6 text-purple-600" />,
      label: 'Active Sessions',
      value: '0',
      trend: 'Real-time',
      color: 'from-purple-600 to-indigo-600',
    },
    {
      icon: <FileText className="w-6 h-6 text-amber-600" />,
      label: 'Audit Logs',
      value: '0',
      trend: 'Last 30 days',
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-3">
            <Shield className="w-7 h-7 text-purple-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-secondary border border-border rounded-2xl p-6 hover:border-border transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  {stat.icon}
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-card-foreground mb-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-secondary border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/hr-users"
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-blue-500 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Manage HR Accounts</p>
                <p className="text-xs text-muted-foreground">Create and manage HR users</p>
              </div>
            </a>

            <a
              href="/admin/employees"
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-emerald-500 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">View Employees</p>
                <p className="text-xs text-muted-foreground">Browse all employees</p>
              </div>
            </a>

            <a
              href="/admin/audit"
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-purple-500 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Audit Logs</p>
                <p className="text-xs text-muted-foreground">View system activity</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-secondary border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-card-foreground">Database</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-card-foreground">API Services</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-card-foreground">Authentication</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
