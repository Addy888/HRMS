'use client';

import React from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import {
  User, Phone, Briefcase, CreditCard, ShieldCheck,
  Save, Loader2, ArrowLeft, Landmark
} from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),

  phone: z.string().regex(/^[6-9]\d{9}$/, 'Primary mobile must be a valid 10-digit number').optional().nullable().or(z.literal('')),
  alternatePhone: z.string().regex(/^[6-9]\d{9}$/, 'Alternate mobile must be a valid 10-digit number').optional().nullable().or(z.literal('')),
  personalEmail: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  permanentAddress: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().regex(/^[6-9]\d{9}$/, 'Emergency contact phone must be 10 digits').optional().nullable().or(z.literal('')),
  emergencyContactRelation: z.string().optional().nullable(),

  reportingManager: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),

  bankAccountHolder: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankBranch: z.string().optional().nullable(),
  bankAccountNumber: z.string().regex(/^\d{9,18}$/, 'Account number must be 9 to 18 digits').optional().nullable().or(z.literal('')),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC code must be valid (e.g. SBIN0001234)').optional().nullable().or(z.literal('')),
  upiId: z.string().optional().nullable(),

  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits').optional().nullable().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'PAN Card must be valid (e.g. ABCDE1234F)').optional().nullable().or(z.literal('')),
  passportNumber: z.string().regex(/^[A-Z]{1}\d{7}$/, 'Passport number must be valid (e.g. Z1234567)').optional().nullable().or(z.literal('')),
  drivingLicenseNumber: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState('personal');

  // Fetch current details
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['employee-profile-details'],
    queryFn: async () => {
      const res = await api.get('/employees/profile');
      return res.data?.data ?? res.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {},
  });

  // Pre-fill form when loaded
  React.useEffect(() => {
    if (profileResponse) {
      const emp = profileResponse;
      reset({
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        fatherName: emp.fatherName || '',
        motherName: emp.motherName || '',
        dob: emp.dob ? emp.dob.substring(0, 10) : '',
        gender: emp.gender || '',
        bloodGroup: emp.bloodGroup || '',
        maritalStatus: emp.maritalStatus || '',
        nationality: emp.nationality || '',
        phone: emp.phone || '',
        alternatePhone: emp.alternatePhone || '',
        personalEmail: emp.personalEmail || '',
        permanentAddress: emp.permanentAddress || '',
        currentAddress: emp.currentAddress || '',
        emergencyContactName: emp.emergencyContactName || '',
        emergencyContactPhone: emp.emergencyContactPhone || '',
        emergencyContactRelation: emp.emergencyContactRelation || '',
        reportingManager: emp.reportingManager || '',
        employmentType: emp.employmentType || '',
        bankAccountHolder: emp.bankAccountHolder || '',
        bankName: emp.bankName || '',
        bankBranch: emp.bankBranch || '',
        bankAccountNumber: emp.bankAccountNumber || '',
        bankIfsc: emp.bankIfsc || '',
        upiId: emp.upiId || '',
        aadhaarNumber: emp.aadhaarNumber || '',
        panNumber: emp.panNumber || '',
        passportNumber: emp.passportNumber || '',
        drivingLicenseNumber: emp.drivingLicenseNumber || '',
      });
    }
  }, [profileResponse, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      await api.put('/employees/profile', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-profile-details'] });
      queryClient.invalidateQueries({ queryKey: ['employee-profile-completion'] });
      router.push('/employee/profile');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to save changes');
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Info', icon: <Phone className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional Info', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'bank', label: 'Bank Details', icon: <Landmark className="w-4 h-4" /> },
    { id: 'government', label: 'Government ID Cards', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-neutral-900 rounded-xl"></div>
          <div className="h-64 bg-neutral-900 rounded-3xl"></div>
        </div>
      </EmployeeLayout>
    );
  }

  const InputField = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof ProfileFormValues; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
      />
      {errors[name] && (
        <span className="text-[11px] text-red-400 font-medium">{errors[name]?.message}</span>
      )}
    </div>
  );

  return (
    <EmployeeLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="font-heading text-2xl font-extrabold text-white">Edit Profile Details</h1>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-2 border-b border-neutral-800 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
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

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 sm:p-8">
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="First Name *" name="firstName" />
                <InputField label="Last Name *" name="lastName" />
                <InputField label="Father's Name" name="fatherName" />
                <InputField label="Mother's Name" name="motherName" />
                <InputField label="Date of Birth" name="dob" type="date" />
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Gender</label>
                  <select {...register('gender')} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <InputField label="Blood Group" name="bloodGroup" placeholder="e.g. O+" />
                <InputField label="Marital Status" name="maritalStatus" placeholder="e.g. Single, Married" />
                <InputField label="Nationality" name="nationality" placeholder="e.g. Indian" />
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Mobile Number" name="phone" placeholder="9876543210" />
                <InputField label="Alternate Mobile Number" name="alternatePhone" placeholder="9876543210" />
                <InputField label="Personal Email" name="personalEmail" placeholder="personal@gmail.com" />
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Permanent Address</label>
                  <textarea {...register('permanentAddress')} rows={2} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Current Address</label>
                  <textarea {...register('currentAddress')} rows={2} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <InputField label="Emergency Contact Name" name="emergencyContactName" />
                <InputField label="Emergency Contact Number" name="emergencyContactPhone" placeholder="9876543210" />
                <InputField label="Emergency Contact Relation" name="emergencyContactRelation" placeholder="e.g. Father, Spouse" />
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Reporting Manager" name="reportingManager" />
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Employment Type</label>
                  <select {...register('employmentType')} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select Type</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Internship</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Account Holder Name" name="bankAccountHolder" />
                <InputField label="Bank Name" name="bankName" />
                <InputField label="Branch Name" name="bankBranch" />
                <InputField label="Account Number" name="bankAccountNumber" />
                <InputField label="IFSC Code" name="bankIfsc" placeholder="SBIN0001234" />
                <InputField label="UPI ID" name="upiId" placeholder="user@upi" />
              </div>
            )}

            {activeTab === 'government' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Aadhaar Number" name="aadhaarNumber" placeholder="12-digit number" />
                <InputField label="PAN Card Number" name="panNumber" placeholder="e.g. ABCDE1234F" />
                <InputField label="Passport Number" name="passportNumber" placeholder="e.g. Z1234567" />
                <InputField label="Driving License Number" name="drivingLicenseNumber" />
              </div>
            )}
          </div>

          {/* Form Save Button Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {updateMutation.isPending ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </EmployeeLayout>
  );
}
