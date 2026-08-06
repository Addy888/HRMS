'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEmployeeModal({ isOpen, onClose }: CreateEmployeeModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    firstName: '', lastName: '', email: '', phone: '',
    gender: '', dob: '', joiningDate: '', departmentId: '', designationId: '', monthlySalary: '',
  });

  // Hardcoded departments - IT and Sales only
  const departments = [
    { id: 'IT', name: 'IT' },
    { id: 'SALES', name: 'Sales' },
  ];

  // Designation mapping based on department
  const designationsByDepartment: Record<string, Array<{ id: string; name: string }>> = {
    IT: [
      { id: 'SOFTWARE_DEVELOPER', name: 'Software Developer' },
      { id: 'FRONTEND_DEVELOPER', name: 'Frontend Developer' },
      { id: 'BACKEND_DEVELOPER', name: 'Backend Developer' },
      { id: 'FULLSTACK_DEVELOPER', name: 'Full Stack Developer' },
      { id: 'UI_UX_DESIGNER', name: 'UI/UX Designer' },
      { id: 'QA_ENGINEER', name: 'QA Engineer' },
      { id: 'DEVOPS_ENGINEER', name: 'DevOps Engineer' },
      { id: 'AI_ENGINEER', name: 'AI Engineer' },
    ],
    SALES: [
      { id: 'SALES_EXECUTIVE', name: 'Sales Executive' },
      { id: 'SENIOR_SALES_EXECUTIVE', name: 'Senior Sales Executive' },
      { id: 'SALES_MANAGER', name: 'Sales Manager' },
      { id: 'BDE', name: 'Business Development Executive' },
      { id: 'BDM', name: 'Business Development Manager' },
      { id: 'TEAM_LEADER', name: 'Team Leader' },
    ],
  };

  // Get filtered designations based on selected department
  const availableDesignations = form.departmentId ? designationsByDepartment[form.departmentId] || [] : [];

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Convert monthlySalary to number if provided
      const dataToSend = {
        ...payload,
        monthlySalary: payload.monthlySalary ? parseFloat(payload.monthlySalary) : undefined,
      };
      await api.post('/employees', dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-stats'] });
      setForm({ firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '', joiningDate: '', departmentId: '', designationId: '', monthlySalary: '' });
      onClose();
    },
    onError: (err: any) => alert(err.message || 'Failed to create employee'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset designation when department changes
    if (name === 'departmentId') {
      setForm(prev => ({ ...prev, departmentId: value, designationId: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }
    if (!form.monthlySalary || parseFloat(form.monthlySalary) <= 0) {
      alert('Please enter a valid monthly salary greater than zero');
      return;
    }
    createMutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Create New Employee</h2>
            <p className="text-sm text-neutral-400 mt-0.5">A login will be automatically generated with password: <code className="text-amber-400 font-mono">1234</code></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: 'First Name *', name: 'firstName', type: 'text', placeholder: 'Rahul' },
              { label: 'Last Name *', name: 'lastName', type: 'text', placeholder: 'Sharma' },
              { label: 'Corporate Email *', name: 'email', type: 'email', placeholder: 'rahul@fcs.com' },
              { label: 'Mobile Number', name: 'phone', type: 'tel', placeholder: '9876543210' },
              { label: 'Date of Birth', name: 'dob', type: 'date', placeholder: '' },
              { label: 'Joining Date', name: 'joiningDate', type: 'date', placeholder: '' },
            ].map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={(form as any)[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}

            {/* Gender Select */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Prefer not to say</option>
              </select>
            </div>

            {/* Department Select */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Department</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Select Department</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Designation Select */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Designation</label>
              <select
                name="designationId"
                value={form.designationId}
                onChange={handleChange}
                disabled={!form.departmentId}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Designation</option>
                {availableDesignations.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Monthly Salary */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Monthly Salary (₹ INR) *</label>
              <input
                type="number"
                name="monthlySalary"
                value={form.monthlySalary}
                onChange={handleChange}
                placeholder="25000"
                min="1"
                step="1"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="mx-6 mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
              Employee ID will be auto-generated (e.g. FCS-2026-XXXX). The employee will be prompted to change their temporary password on first login.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {createMutation.isPending ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
