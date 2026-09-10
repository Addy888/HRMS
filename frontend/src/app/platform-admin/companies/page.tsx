'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { Card } from '@/components/ui/card';
import {
  Building2,
  Users,
  Shield,
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import axios from 'axios';

interface Organization {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    employees: number;
    departments: number;
  };
}

export default function CompaniesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [companies, setCompanies] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params: any = {};
        if (searchTerm) params.search = searchTerm;
        if (filterActive !== 'all') params.isActive = filterActive === 'active';

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/platform/organizations`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
          }
        );

        if (response.data.success) {
          setCompanies(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [token, searchTerm, filterActive]);

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/platform/organizations/${companyId}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCompanies((prev) =>
          prev.map((company) =>
            company.id === companyId
              ? { ...company, isActive: !currentStatus }
              : company
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle company status:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage all organizations on the platform
          </p>
        </div>
        <button
          onClick={() => router.push('/platform-admin/companies/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Company
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </Card>

      {/* Companies Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : companies.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-card-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No companies found
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first company'}
          </p>
          {!searchTerm && filterActive === 'all' && (
            <button
              onClick={() => router.push('/platform-admin/companies/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Company
            </button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {company.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Code: {company.code}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        <strong>{company._count.employees}</strong> Employees
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        <strong>{company._count.users}</strong> Users
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        <strong>{company._count.departments}</strong> Departments
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {(company.email || company.phone) && (
                    <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                      {company.email && <span>✉ {company.email}</span>}
                      {company.phone && <span>📞 {company.phone}</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      company.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {company.isActive ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {company.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/platform-admin/companies/${company.id}`)}
                      className="p-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/platform-admin/companies/${company.id}/edit`)}
                      className="p-2 bg-neutral-600 text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(company.id, company.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        company.isActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={company.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {company.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
