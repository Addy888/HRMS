'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  ArrowLeft,
  Users,
  Shield,
  Activity,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  TrendingUp,
} from 'lucide-react';
import axios from 'axios';

interface OrganizationDetails {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    employees: number;
    departments: number;
    designations: number;
    attendances: number;
    PayrollRun: number;
    hrActions: number;
  };
  users: Array<{
    id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const [company, setCompany] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!token || !params.id) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/platform/organizations/${params.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setCompany(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch company details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [token, params.id]);

  const handleToggleStatus = async () => {
    if (!token || !company) return;

    try {
      const endpoint = company.isActive ? 'deactivate' : 'activate';
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/platform/organizations/${company.id}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCompany((prev) =>
          prev ? { ...prev, isActive: !prev.isActive } : null
        );
      }
    } catch (error) {
      console.error('Failed to toggle company status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Company not found
          </h3>
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-neutral-900">
                {company.name}
              </h1>
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
            </div>
            <p className="text-neutral-600 mt-1">Code: {company.code}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/platform-admin/companies/${company.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              company.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {company.isActive ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {company.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {company.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-neutral-500" />
              <span className="text-neutral-900">{company.email}</span>
            </div>
          )}
          {company.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-neutral-500" />
              <span className="text-neutral-900">{company.phone}</span>
            </div>
          )}
          {company.address && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-neutral-500 mt-0.5" />
              <span className="text-neutral-900">{company.address}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-neutral-500" />
            <span className="text-neutral-600">
              Created: {new Date(company.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {company._count.users}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Employees
            </CardTitle>
            <Shield className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {company._count.employees}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Departments
            </CardTitle>
            <Activity className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {company._count.departments}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Designations
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {company._count.designations}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600">
              Attendance Records
            </CardTitle>
            <Activity className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {company._count.attendances}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-600">
              HR Actions
            </CardTitle>
            <Shield className="h-5 w-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">
              {company._count.hrActions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Super Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Company Super Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.users.length === 0 ? (
            <p className="text-sm text-neutral-600">No super admins found</p>
          ) : (
            <div className="space-y-3">
              {company.users.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{admin.email}</p>
                    <p className="text-xs text-neutral-500">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      admin.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
