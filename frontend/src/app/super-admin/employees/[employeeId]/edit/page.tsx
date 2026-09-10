'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminEmployeeEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params?.employeeId as string;

  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    departmentId: '',
    designationId: '',
    joiningDate: '',
    monthlySalary: '',
    employmentType: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    panNumber: '',
    aadhaarNumber: '',
  });

  const { data: employee, isLoading } = useQuery({
    queryKey: ['super-admin-employee-detail', employeeId],
    queryFn: async () => {
      const res = await api.get(`/super-admin/employees/${employeeId}`);
      const emp = res.data?.data || res.data;
      
      // Populate form with existing data
      setFormData({
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        phone: emp.phone || '',
        dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
        gender: emp.gender || '',
        bloodGroup: emp.bloodGroup || '',
        address: emp.address || '',
        departmentId: emp.departmentId || '',
        designationId: emp.designationId || '',
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
        monthlySalary: emp.monthlySalary || '',
        employmentType: emp.employmentType || '',
        bankAccountNumber: emp.bankAccountNumber || '',
        bankIfsc: emp.bankIfsc || '',
        bankName: emp.bankName || '',
        panNumber: emp.panNumber || '',
        aadhaarNumber: emp.aadhaarNumber || '',
      });
      
      return emp;
    },
    enabled: !!employeeId,
  });

  const { data: departments } = useQuery({
    queryKey: ['super-admin-processes'],
    queryFn: async () => {
      const res = await api.get('/super-admin/processes');
      return res.data?.data || res.data;
    },
  });

  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await api.get('/designations');
      return res.data?.data || res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/super-admin/employees/${employeeId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-employee-detail', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-employees'] });
      router.push(`/super-admin/employees/${employeeId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/super-admin/employees/${employeeId}`}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-3">
                <User className="w-8 h-8 text-purple-500" />
                Edit Employee
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {employee?.fullName} ({employee?.employeeId})
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-secondary disabled:cursor-not-allowed text-foreground rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>

        {updateMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-600">Update Failed</p>
              <p className="text-sm text-red-300 mt-1">
                {(updateMutation.error as any)?.response?.data?.message || 'An error occurred'}
              </p>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" />
            Employment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Department / Process
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Department</option>
                {Array.isArray(departments) && departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Designation
              </label>
              <select
                name="designationId"
                value={formData.designationId}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Designation</option>
                {Array.isArray(designations) && designations.map((desig: any) => (
                  <option key={desig.id} value={desig.id}>{desig.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Joining Date
              </label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Employment Type
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Type</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Salary Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Monthly Salary (₹)
              </label>
              <input
                type="number"
                name="monthlySalary"
                value={formData.monthlySalary}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Bank & Identity Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Account Number
              </label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                name="bankIfsc"
                value={formData.bankIfsc}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Aadhaar Number
              </label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/super-admin/employees/${employeeId}`}
            className="px-6 py-3 bg-secondary hover:bg-secondary/50 text-foreground rounded-xl font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-secondary disabled:cursor-not-allowed text-foreground rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </SuperAdminLayout>
  );
}
