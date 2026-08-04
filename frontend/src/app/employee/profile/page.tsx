'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  User, Phone, Briefcase, Building, CreditCard, ShieldCheck,
  Edit2, Camera, Trash2, Loader2, Landmark
} from 'lucide-react';
import Link from 'next/link';

export default function EmployeeProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch full profile info
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['employee-profile-details'],
    queryFn: async () => {
      const res = await api.get('/employees/profile');
      return res.data?.data ?? res.data;
    },
  });

  const emp = profileResponse || {};

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/employees/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-profile-details'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to upload photo'),
  });

  // Photo delete mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/employees/profile/photo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-profile-details'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to delete photo'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const [activeTab, setActiveTab] = React.useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Info', icon: <Phone className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional Info', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'bank', label: 'Bank Details', icon: <Landmark className="w-4 h-4" /> },
    { id: 'government', label: 'Government details', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-neutral-900 rounded-3xl"></div>
          <div className="h-8 w-64 bg-neutral-900 rounded-xl"></div>
          <div className="h-64 bg-neutral-900 rounded-3xl"></div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Banner with Profile Picture */}
        <div className="relative overflow-hidden bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-neutral-800 border-2 border-neutral-700 overflow-hidden flex items-center justify-center font-heading text-3xl font-extrabold text-white uppercase shadow-xl relative">
              {emp.photoUrl ? (
                <img
                  src={`${api.defaults.baseURL?.replace('/api/v1', '')}${emp.photoUrl}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                `${emp.firstName?.charAt(0)}${emp.lastName?.charAt(0)}`
              )}
              {uploadPhotoMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg border border-blue-500/30 transition-colors"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              {emp.photoUrl && (
                <button
                  onClick={() => { if (confirm('Delete photo?')) deletePhotoMutation.mutate(); }}
                  className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg border border-red-500/30 transition-colors"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <h1 className="font-heading text-2xl font-extrabold text-white truncate">{emp.firstName} {emp.lastName}</h1>
            <p className="text-xs text-neutral-400 font-mono font-medium">{emp.employeeId} · {emp.designation?.name || 'Designation Pending'}</p>
            <p className="text-xs text-neutral-500">{emp.department?.name || 'Department Pending'}</p>
          </div>

          <Link
            href="/employee/profile/edit"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shrink-0"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile Details
          </Link>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-neutral-800 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Cards */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'First Name', val: emp.firstName },
                { label: 'Last Name', val: emp.lastName },
                { label: "Father's Name", val: emp.fatherName },
                { label: "Mother's Name", val: emp.motherName },
                { label: 'Date of Birth', val: emp.dob ? new Date(emp.dob).toLocaleDateString() : '' },
                { label: 'Gender', val: emp.gender },
                { label: 'Blood Group', val: emp.bloodGroup },
                { label: 'Marital Status', val: emp.maritalStatus },
                { label: 'Nationality', val: emp.nationality },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-neutral-900">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-white">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Mobile Number', val: emp.phone },
                { label: 'Alternate Mobile Number', val: emp.alternatePhone },
                { label: 'Personal Email', val: emp.personalEmail },
                { label: 'Permanent Address', val: emp.permanentAddress },
                { label: 'Current Address', val: emp.currentAddress },
                { label: 'Emergency Contact Name', val: emp.emergencyContactName },
                { label: 'Emergency Contact Number', val: emp.emergencyContactPhone },
                { label: 'Emergency Contact Relation', val: emp.emergencyContactRelation },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-neutral-900">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-white">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Employee ID', val: emp.employeeId },
                { label: 'Department', val: emp.department?.name },
                { label: 'Designation', val: emp.designation?.name },
                { label: 'Reporting Manager', val: emp.reportingManager },
                { label: 'Employment Type', val: emp.employmentType },
                { label: 'Joining Date', val: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '' },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-neutral-900">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-white">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Account Holder Name', val: emp.bankAccountHolder },
                { label: 'Bank Name', val: emp.bankName },
                { label: 'Branch Name', val: emp.bankBranch },
                { label: 'Account Number', val: emp.bankAccountNumber },
                { label: 'IFSC Code', val: emp.bankIfsc },
                { label: 'UPI ID', val: emp.upiId },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-neutral-900">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-white">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'government' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Aadhaar Number', val: emp.aadhaarNumber },
                { label: 'PAN Card Number', val: emp.panNumber },
                { label: 'Passport Number', val: emp.passportNumber },
                { label: 'Driving License Number', val: emp.drivingLicenseNumber },
              ].map((item, i) => (
                <div key={i} className="space-y-1 py-2 border-b border-neutral-900">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-white">{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
