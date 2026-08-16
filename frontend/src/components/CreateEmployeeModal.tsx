'use client';

import React from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEmployeeModal({ isOpen, onClose }: CreateEmployeeModalProps) {
  const queryClient = useQueryClient();
  const [employeeIdMode, setEmployeeIdMode] = React.useState<'auto' | 'manual'>('auto');
  const [form, setForm] = React.useState({
    employeeId: '',
    firstName: '', lastName: '', email: '', phone: '',
    gender: '', dob: '', joiningDate: '', departmentId: '', designationId: '', monthlySalary: '',
  });

  // Fetch next Employee ID for preview
  const { data: nextIdData } = useQuery({
    queryKey: ['next-employee-id'],
    queryFn: async () => {
      const res = await api.get('/employees/next-employee-id');
      return res.data;
    },
    enabled: isOpen && employeeIdMode === 'auto',
    refetchOnMount: true,
    staleTime: 0,
  });

  const nextEmployeeId = nextIdData?.nextEmployeeId || 'FCS0160';

  // Fetch real departments from API
  const { data: departmentsData, isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments-list-modal'],
    queryFn: async () => {
      console.log('🔍 Fetching departments from API...');
      const res = await api.get('/departments');
      const departments = Array.isArray(res.data) ? res.data : res.data?.data || [];
      console.log('📊 Departments loaded:', departments.length, 'items');
      console.log('📋 Departments data:', departments);
      return departments;
    },
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch real designations from API
  const { data: designationsData, isLoading: loadingDesignations } = useQuery({
    queryKey: ['designations-list-modal'],
    queryFn: async () => {
      console.log('🔍 Fetching designations from API...');
      const res = await api.get('/designations');
      const designations = Array.isArray(res.data) ? res.data : res.data?.data || [];
      console.log('📊 Designations loaded:', designations.length, 'items');
      console.log('📋 Designations data:', designations);
      return designations;
    },
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 0, // Always fetch fresh data
  });

  const departments: any[] = departmentsData || [];
  const designations: any[] = designationsData || [];

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Convert monthlySalary to number if provided
      const dataToSend = {
        ...payload,
        employeeIdMode,
        employeeId: employeeIdMode === 'manual' ? payload.employeeId : undefined,
        monthlySalary: payload.monthlySalary ? parseFloat(payload.monthlySalary) : undefined,
      };
      const res = await api.post('/employees', dataToSend);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['hr-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['next-employee-id'] });
      setForm({ 
        employeeId: '',
        firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '', joiningDate: '', departmentId: '', designationId: '', monthlySalary: '' 
      });
      setEmployeeIdMode('auto');
      onClose();
      const employeeId = data?.employee?.employeeId || data?.data?.employeeId || 'Unknown';
      alert(`Employee created successfully!\nEmployee ID: ${employeeId}`);
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create employee';
      alert(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
    
    // Validate manual Employee ID
    if (employeeIdMode === 'manual') {
      if (!form.employeeId || !form.employeeId.trim()) {
        alert('Please enter an Employee ID');
        return;
      }
      const employeeIdRegex = /^FCS\d{4,}$/;
      if (!employeeIdRegex.test(form.employeeId.trim())) {
        alert('Employee ID must follow format FCS#### (e.g., FCS0151, FCS0160)');
        return;
      }
    }
    
    console.log('📤 Submitting employee creation with:', {
      ...form,
      employeeIdMode,
      departmentId: form.departmentId || 'NOT SET',
      designationId: form.designationId || 'NOT SET',
    });
    createMutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Create New Employee</h2>
            <p className="text-sm text-neutral-400 mt-0.5">A login will be automatically generated with password: <code className="text-amber-400 font-mono">1234</code></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Employee ID Mode Selection */}
            <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-3 block">
                Employee ID
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setEmployeeIdMode('auto')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    employeeIdMode === 'auto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  Auto Generate
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeIdMode('manual')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    employeeIdMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  Enter Manually
                </button>
              </div>

              {employeeIdMode === 'auto' ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-neutral-400 font-semibold">Next Employee ID</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{nextEmployeeId}</div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Employee ID will be automatically assigned upon creation.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    placeholder="FCS0155"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    required={employeeIdMode === 'manual'}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter a unique Employee ID for this employee (format: FCS####)
                  </p>
                </div>
              )}
            </div>

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

              {/* Process Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  Process
                </label>
                <input
                  type="text"
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  placeholder="Enter process name"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Designation Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  Designation {loadingDesignations && '(Loading...)'}
                </label>
                <select
                  name="designationId"
                  value={form.designationId}
                  onChange={(e) => {
                    console.log('💼 Designation selected:', {
                      value: e.target.value,
                      option: designations.find((d: any) => d.id === e.target.value)
                    });
                    handleChange(e);
                  }}
                  disabled={loadingDesignations}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select Designation</option>
                  {designations.map((d: any) => {
                    console.log('💼 Designation option:', { id: d.id, name: d.name });
                    return <option key={d.id} value={d.id}>{d.name}</option>;
                  })}
                </select>
                {designations.length === 0 && !loadingDesignations && (
                  <p className="text-xs text-red-400">No designations found. Please create designations first.</p>
                )}
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
            <div className="mx-6 mb-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
                The employee will receive temporary password: <code className="font-mono font-bold">1234</code>. They will be prompted to change it on first login.
              </p>
            </div>
          </div>

          {/* Modal Footer - Fixed */}
          <div className="flex gap-3 px-6 py-4 border-t border-neutral-800 shrink-0 bg-neutral-950">
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
