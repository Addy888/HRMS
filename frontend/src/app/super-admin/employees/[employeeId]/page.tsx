'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  IndianRupee,
  Layers,
  Building2,
  Edit2,
  Save,
  X as XIcon,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminEmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params?.employeeId as string;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editFormData, setEditFormData] = React.useState<any>({});

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['super-admin-employee-detail', employeeId],
    queryFn: async () => {
      const res = await api.get(`/super-admin/employees/${employeeId}`);
      return res.data?.data || res.data;
    },
    enabled: !!employeeId,
    retry: false,
  });

  // Load departments for edit form
  const { data: departments = [] } = useQuery({
    queryKey: ['super-admin-departments'],
    queryFn: async () => {
      const res = await api.get('/super-admin/processes');
      return res.data?.data || res.data || [];
    },
    enabled: isEditing,
  });

  // Load designations for edit form
  const { data: designations = [] } = useQuery({
    queryKey: ['designations-list'],
    queryFn: async () => {
      const res = await api.get('/designations');
      return res.data?.data || res.data || [];
    },
    enabled: isEditing,
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/super-admin/employees/${employeeId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-employee-detail', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-change-history', employeeId] });
      setIsEditing(false);
      alert('Employee updated successfully');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to update employee');
    },
  });

  // Activate/Deactivate mutation
  const toggleActivationMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const endpoint = activate ? 'activate' : 'deactivate';
      const res = await api.post(`/super-admin/employees/${employeeId}/${endpoint}`);
      return res.data;
    },
    onSuccess: (_, activate) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-employee-detail', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-employees'] });
      alert(`Employee ${activate ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Operation failed');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/super-admin/employees/${employeeId}/reset-password`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Password reset successfully. New password: ${data.defaultPassword || '1234'}`);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to reset password');
    },
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/super-admin/employees/${employeeId}`);
      return res.data;
    },
    onSuccess: () => {
      alert('Employee deleted successfully');
      router.push('/super-admin/employees');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to delete employee');
    },
  });

  const handleEditClick = () => {
    setEditFormData({
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      phone: employee?.phone || '',
      dob: employee?.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
      gender: employee?.gender || '',
      bloodGroup: employee?.bloodGroup || '',
      address: employee?.address || '',
      departmentId: employee?.departmentId || '',
      designationId: employee?.designationId || '',
      joiningDate: employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
      monthlySalary: employee?.monthlySalary || '',
      employmentType: employee?.employmentType || '',
      bankAccountNumber: employee?.bankAccountNumber || '',
      bankIfsc: employee?.bankIfsc || '',
      bankName: employee?.bankName || '',
      panNumber: employee?.panNumber || '',
      aadhaarNumber: employee?.aadhaarNumber || '',
      reason: '', // ✅ NEW: Mandatory reason field
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleSaveEdit = () => {
    // ✅ Validate reason is provided
    if (!editFormData.reason || !editFormData.reason.trim()) {
      alert('Please provide a reason for this update');
      return;
    }
    
    if (confirm('Are you sure you want to save these changes?')) {
      updateMutation.mutate(editFormData);
    }
  };

  const handleToggleActivation = () => {
    const action = employee?.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} this employee?`)) {
      toggleActivationMutation.mutate(!employee?.isActive);
    }
  };

  const handleResetPassword = () => {
    if (confirm('Are you sure you want to reset this employee\'s password to default (1234)?')) {
      resetPasswordMutation.mutate();
    }
  };

  const handleDeleteEmployee = () => {
    if (confirm('⚠️ WARNING: This will permanently delete the employee and all related data. This cannot be undone. Are you sure?')) {
      if (confirm('Final confirmation: Type YES to confirm deletion')) {
        deleteMutation.mutate();
      }
    }
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

  if (error) {
    const errorMessage = (error as any)?.response?.status === 404
      ? 'Employee not found'
      : (error as any)?.response?.status === 403
      ? 'Access denied'
      : (error as any)?.response?.status === 401
      ? 'Authentication required'
      : 'Failed to load employee details';

    return (
      <SuperAdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-foreground">{errorMessage}</h2>
          <p className="text-muted-foreground">
            {(error as any)?.response?.data?.message || 'Please try again later'}
          </p>
          <button
            onClick={() => router.push('/super-admin/employees')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-foreground rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!employee) {
    return (
      <SuperAdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">Employee Not Found</h2>
          <button
            onClick={() => router.push('/super-admin/employees')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-foreground rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header with Back Button and Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/super-admin/employees')}
            className="p-2 hover:bg-secondary/30 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-extrabold text-foreground flex items-center gap-3">
              <User className="w-8 h-8 text-purple-500" />
              Employee Details
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete profile and activity information
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-foreground rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleToggleActivation}
                  disabled={toggleActivationMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                    employee.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  } disabled:opacity-50`}
                >
                  {employee.isActive ? (
                    <>
                      <UserX className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-foreground rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-foreground rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-foreground rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <XIcon className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>

          <div className={`px-4 py-2 rounded-lg ${
            employee.isActive 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}>
            {employee.isActive ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span className="font-semibold">Inactive</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Employee Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-card-foreground mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Basic Information {isEditing && <span className="text-sm text-amber-600">(Editing)</span>}
              </h2>
              
              <div className="flex items-start gap-6 mb-6 pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center font-heading text-2xl font-bold text-white uppercase shrink-0">
                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                </div>
                <div className="flex-1">
                  {!isEditing ? (
                    <>
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        {employee.fullName || `${employee.firstName} ${employee.lastName}`}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-2">{employee.employeeId}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {employee.email || employee.user?.email}
                        </span>
                        {employee.phone && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {employee.phone}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">First Name</label>
                          <input
                            type="text"
                            value={editFormData.firstName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Last Name</label>
                          <input
                            type="text"
                            value={editFormData.lastName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Phone</label>
                        <input
                          type="text"
                          value={editFormData.phone || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isEditing ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Department / Process
                      </p>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <p className="text-foreground font-medium">
                          {employee.departmentName || employee.department?.name || (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Designation
                      </p>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <p className="text-foreground font-medium">
                          {employee.designationTitle || employee.designation?.name || (
                            <span className="text-muted-foreground italic">Not assigned</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Joining Date
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <p className="text-foreground font-medium">
                          {formatDate(employee.joiningDate)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Created By
                      </p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <p className="text-foreground font-medium">
                          {employee.createdByName || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Department</label>
                      <select
                        value={editFormData.departmentId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Department</option>
                        {Array.isArray(departments) && departments.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Designation</label>
                      <select
                        value={editFormData.designationId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, designationId: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Designation</option>
                        {Array.isArray(designations) && designations.map((desig: any) => (
                          <option key={desig.id} value={desig.id}>{desig.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Joining Date</label>
                      <input
                        type="date"
                        value={editFormData.joiningDate || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Employment Type</label>
                      <select
                        value={editFormData.employmentType || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, employmentType: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Type</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Additional Edit Fields */}
              {isEditing && (
                <div className="mt-6 pt-6 border-t border-border space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-4">Personal Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Date of Birth</label>
                      <input
                        type="date"
                        value={editFormData.dob || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Gender</label>
                      <select
                        value={editFormData.gender || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Blood Group</label>
                      <input
                        type="text"
                        value={editFormData.bloodGroup || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                        placeholder="e.g., A+"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Monthly Salary</label>
                      <input
                        type="number"
                        value={editFormData.monthlySalary || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, monthlySalary: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Address</label>
                    <textarea
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      rows={3}
                      placeholder="Full address"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-4 mt-6">Bank & Government Details</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Bank Name</label>
                      <input
                        type="text"
                        value={editFormData.bankName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Account Number</label>
                      <input
                        type="text"
                        value={editFormData.bankAccountNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">IFSC Code</label>
                      <input
                        type="text"
                        value={editFormData.bankIfsc || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bankIfsc: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">PAN Number</label>
                      <input
                        type="text"
                        value={editFormData.panNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value.toUpperCase() })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Aadhaar Number</label>
                      <input
                        type="text"
                        value={editFormData.aadhaarNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500"
                        maxLength={12}
                      />
                    </div>
                  </div>

                  {/* ✅ NEW: Mandatory Reason Field */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-lg font-bold text-foreground mb-4">Update Reason <span className="text-red-600">*</span></h3>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                        Reason for Update <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={editFormData.reason || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-purple-500 resize-none"
                        rows={4}
                        placeholder="Enter the reason for updating employee information (e.g., Employee information correction, Promotion, Department transfer, Salary revision)"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        This reason will be recorded in the employee change history for audit purposes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Salary & Payroll Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-500" />
                Salary & Compensation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                    Monthly Salary
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(employee.monthlySalary || employee.totalSalary)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                    Incentive
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(employee.incentive || 0)}
                  </p>
                </div>
              </div>

              {employee.payslips && employee.payslips.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    Recent Payslips
                  </p>
                  <div className="space-y-2">
                    {employee.payslips.slice(0, 3).map((payslip: any) => (
                      <div
                        key={payslip.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <span className="text-sm text-card-foreground">
                          {new Date(payslip.year, payslip.month - 1).toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          ₹{payslip.netSalary?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Summary */}
            {employee.attendanceSummary && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Attendance Summary (Last 30 Days)
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {employee.attendanceSummary.present}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      Present
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {employee.attendanceSummary.absent}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      Absent
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {employee.attendanceSummary.late}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      Late
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {employee.attendanceSummary.halfDay}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      Half Day
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Personal Details</h2>
              
              <div className="space-y-3 text-sm">
                {employee.dob && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="text-foreground font-medium">{formatDate(employee.dob)}</span>
                  </div>
                )}
                {employee.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="text-foreground font-medium">{employee.gender}</span>
                  </div>
                )}
                {employee.bloodGroup && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blood Group</span>
                    <span className="text-foreground font-medium">{employee.bloodGroup}</span>
                  </div>
                )}
                {employee.employmentType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employment Type</span>
                    <span className="text-foreground font-medium">{employee.employmentType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* HR Actions */}
            {employee.hrActions && employee.hrActions.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Recent HR Actions
                </h2>
                <div className="space-y-3">
                  {employee.hrActions.slice(0, 5).map((action: any) => (
                    <div key={action.id} className="p-3 bg-secondary rounded-lg border-l-2 border-amber-500">
                      <p className="text-xs font-mono text-muted-foreground mb-1">
                        {action.actionNumber}
                      </p>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        {action.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(action.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">System Info</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="text-foreground font-mono font-medium">{employee.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="text-foreground font-mono text-xs">{employee.user?.id || employee.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Login</span>
                  <span className="text-foreground font-medium">
                    {employee.user?.isFirstLogin ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="text-foreground font-medium">
                    {formatDate(employee.user?.createdAt || employee.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
