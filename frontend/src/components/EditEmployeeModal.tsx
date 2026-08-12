'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface EditEmployeeModalProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditEmployeeModal({ employee, isOpen, onClose }: EditEmployeeModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    firstName: '', lastName: '', phone: '',
    gender: '', dob: '', joiningDate: '',
    address: '', emergencyContact: '',
    departmentId: '', designationId: '',
  });

  React.useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        gender: employee.gender || '',
        dob: employee.dob ? employee.dob.substring(0, 10) : '',
        joiningDate: employee.joiningDate ? employee.joiningDate.substring(0, 10) : '',
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || '',
        departmentId: employee.departmentId || '',
        designationId: employee.designationId || '',
      });
    }
  }, [employee]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      try { const r = await api.get('/departments'); return Array.isArray(r.data) ? r.data : r.data?.data || []; }
      catch { return [{ id: '1', name: 'Engineering' }, { id: '2', name: 'HR' }]; }
    }
  });

  const { data: designations = [] } = useQuery({
    queryKey: ['designations-list'],
    queryFn: async () => {
      try { const r = await api.get('/designations'); return Array.isArray(r.data) ? r.data : r.data?.data || []; }
      catch { return [{ id: '1', name: 'Software Engineer' }]; }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      await api.put(`/employees/${employee.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: [`employee-${employee.id}`] });
      onClose();
    },
    onError: (err: any) => alert(err.message || 'Failed to update employee'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Edit Employee Profile</h2>
            <p className="text-sm text-neutral-400 mt-0.5">{employee.employeeId} — {employee.firstName} {employee.lastName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: 'First Name', name: 'firstName', type: 'text' },
              { label: 'Last Name', name: 'lastName', type: 'text' },
              { label: 'Phone', name: 'phone', type: 'tel' },
              { label: 'Date of Birth', name: 'dob', type: 'date' },
              { label: 'Joining Date', name: 'joiningDate', type: 'date' },
            ].map(field => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={(form as any)[field.name]}
                  onChange={handleChange}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Department</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select Department</option>
                {(departments as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Designation</label>
              <select name="designationId" value={form.designationId} onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option value="">Select Designation</option>
                {(designations as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Full residential address" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Emergency Contact</label>
              <input type="text" name="emergencyContact" value={form.emergencyContact} onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Name: Phone Number" />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
