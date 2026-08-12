'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  User,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Shield,
  FileText,
  Save,
  X,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Zod Validation Schema
const salaryStructureSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  effectiveTo: z.string().optional(),
  template: z.string().optional(),
  
  // Basic Salary
  basicSalary: z.number().min(0, 'Cannot be negative'),
  
  // Earnings
  hraType: z.enum(['fixed', 'percentage']),
  hra: z.number().min(0, 'Cannot be negative'),
  
  specialAllowanceType: z.enum(['fixed', 'percentage']),
  specialAllowance: z.number().min(0, 'Cannot be negative'),
  
  medicalAllowanceType: z.enum(['fixed', 'percentage']),
  medicalAllowance: z.number().min(0, 'Cannot be negative'),
  
  conveyanceType: z.enum(['fixed', 'percentage']),
  conveyance: z.number().min(0, 'Cannot be negative'),
  
  foodAllowanceType: z.enum(['fixed', 'percentage']),
  foodAllowance: z.number().min(0, 'Cannot be negative'),
  
  telephoneAllowanceType: z.enum(['fixed', 'percentage']),
  telephoneAllowance: z.number().min(0, 'Cannot be negative'),
  
  internetAllowanceType: z.enum(['fixed', 'percentage']),
  internetAllowance: z.number().min(0, 'Cannot be negative'),
  
  bonusType: z.enum(['fixed', 'percentage']),
  bonus: z.number().min(0, 'Cannot be negative'),
  
  overtimeType: z.enum(['fixed', 'percentage']),
  overtime: z.number().min(0, 'Cannot be negative'),
  
  performanceIncentiveType: z.enum(['fixed', 'percentage']),
  performanceIncentive: z.number().min(0, 'Cannot be negative'),
  
  otherAllowancesType: z.enum(['fixed', 'percentage']),
  otherAllowances: z.number().min(0, 'Cannot be negative'),
  
  // Deductions
  pfType: z.enum(['fixed', 'percentage']),
  pf: z.number().min(0, 'Cannot be negative'),
  
  esiType: z.enum(['fixed', 'percentage']),
  esi: z.number().min(0, 'Cannot be negative'),
  
  professionalTaxType: z.enum(['fixed', 'percentage']),
  professionalTax: z.number().min(0, 'Cannot be negative'),
  
  tdsType: z.enum(['fixed', 'percentage']),
  tds: z.number().min(0, 'Cannot be negative'),
  
  labourWelfareFundType: z.enum(['fixed', 'percentage']),
  labourWelfareFund: z.number().min(0, 'Cannot be negative'),
  
  loanRecoveryType: z.enum(['fixed', 'percentage']),
  loanRecovery: z.number().min(0, 'Cannot be negative'),
  
  advanceSalaryRecoveryType: z.enum(['fixed', 'percentage']),
  advanceSalaryRecovery: z.number().min(0, 'Cannot be negative'),
  
  otherDeductionsType: z.enum(['fixed', 'percentage']),
  otherDeductions: z.number().min(0, 'Cannot be negative'),
  
  // Employer Contributions
  employerPfType: z.enum(['fixed', 'percentage']),
  employerPf: z.number().min(0, 'Cannot be negative'),
  
  employerEsiType: z.enum(['fixed', 'percentage']),
  employerEsi: z.number().min(0, 'Cannot be negative'),
  
  gratuityType: z.enum(['fixed', 'percentage']),
  gratuity: z.number().min(0, 'Cannot be negative'),
  
  insuranceType: z.enum(['fixed', 'percentage']),
  insurance: z.number().min(0, 'Cannot be negative'),
  
  // Notes
  remarks: z.string().optional(),
});

type SalaryStructureFormData = z.infer<typeof salaryStructureSchema>;

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  designationTitle: string;
  joiningDate: string;
}

interface SalaryStructureFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SalaryStructureForm({
  initialData,
  onSuccess,
  onCancel,
}: SalaryStructureFormProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm<SalaryStructureFormData>({
    resolver: zodResolver(salaryStructureSchema),
    defaultValues: {
      employeeId: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      template: '',
      basicSalary: 0,
      hraType: 'percentage',
      hra: 40,
      specialAllowanceType: 'percentage',
      specialAllowance: 0,
      medicalAllowanceType: 'fixed',
      medicalAllowance: 0,
      conveyanceType: 'fixed',
      conveyance: 0,
      foodAllowanceType: 'fixed',
      foodAllowance: 0,
      telephoneAllowanceType: 'fixed',
      telephoneAllowance: 0,
      internetAllowanceType: 'fixed',
      internetAllowance: 0,
      bonusType: 'fixed',
      bonus: 0,
      overtimeType: 'fixed',
      overtime: 0,
      performanceIncentiveType: 'fixed',
      performanceIncentive: 0,
      otherAllowancesType: 'fixed',
      otherAllowances: 0,
      pfType: 'percentage',
      pf: 12,
      esiType: 'percentage',
      esi: 0.75,
      professionalTaxType: 'fixed',
      professionalTax: 200,
      tdsType: 'percentage',
      tds: 0,
      labourWelfareFundType: 'fixed',
      labourWelfareFund: 0,
      loanRecoveryType: 'fixed',
      loanRecovery: 0,
      advanceSalaryRecoveryType: 'fixed',
      advanceSalaryRecovery: 0,
      otherDeductionsType: 'fixed',
      otherDeductions: 0,
      employerPfType: 'percentage',
      employerPf: 12,
      employerEsiType: 'percentage',
      employerEsi: 3.25,
      gratuityType: 'percentage',
      gratuity: 4.81,
      insuranceType: 'fixed',
      insurance: 0,
      remarks: '',
    },
  });

  const formValues = watch();

  // Fetch employees for search
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees', searchTerm],
    queryFn: async () => {
      const response = await api.get('/employees', {
        params: { search: searchTerm },
      });
      return response.data?.data || [];
    },
    enabled: showEmployeeSearch,
  });

  // Calculate helper function
  const calculateAmount = (base: number, type: 'fixed' | 'percentage', value: number) => {
    if (type === 'percentage') {
      return (base * value) / 100;
    }
    return value;
  };

  // Live calculations
  const basicSalary = formValues.basicSalary || 0;
  
  // Earnings
  const hraAmount = calculateAmount(basicSalary, formValues.hraType, formValues.hra);
  const specialAllowanceAmount = calculateAmount(basicSalary, formValues.specialAllowanceType, formValues.specialAllowance);
  const medicalAllowanceAmount = calculateAmount(basicSalary, formValues.medicalAllowanceType, formValues.medicalAllowance);
  const conveyanceAmount = calculateAmount(basicSalary, formValues.conveyanceType, formValues.conveyance);
  const foodAllowanceAmount = calculateAmount(basicSalary, formValues.foodAllowanceType, formValues.foodAllowance);
  const telephoneAllowanceAmount = calculateAmount(basicSalary, formValues.telephoneAllowanceType, formValues.telephoneAllowance);
  const internetAllowanceAmount = calculateAmount(basicSalary, formValues.internetAllowanceType, formValues.internetAllowance);
  const bonusAmount = calculateAmount(basicSalary, formValues.bonusType, formValues.bonus);
  const overtimeAmount = calculateAmount(basicSalary, formValues.overtimeType, formValues.overtime);
  const performanceIncentiveAmount = calculateAmount(basicSalary, formValues.performanceIncentiveType, formValues.performanceIncentive);
  const otherAllowancesAmount = calculateAmount(basicSalary, formValues.otherAllowancesType, formValues.otherAllowances);
  
  const grossEarnings = basicSalary + hraAmount + specialAllowanceAmount + medicalAllowanceAmount + 
    conveyanceAmount + foodAllowanceAmount + telephoneAllowanceAmount + internetAllowanceAmount +
    bonusAmount + overtimeAmount + performanceIncentiveAmount + otherAllowancesAmount;
  
  // Deductions
  const pfAmount = calculateAmount(basicSalary, formValues.pfType, formValues.pf);
  const esiAmount = calculateAmount(grossEarnings, formValues.esiType, formValues.esi);
  const professionalTaxAmount = calculateAmount(basicSalary, formValues.professionalTaxType, formValues.professionalTax);
  const tdsAmount = calculateAmount(grossEarnings, formValues.tdsType, formValues.tds);
  const labourWelfareFundAmount = calculateAmount(basicSalary, formValues.labourWelfareFundType, formValues.labourWelfareFund);
  const loanRecoveryAmount = calculateAmount(basicSalary, formValues.loanRecoveryType, formValues.loanRecovery);
  const advanceSalaryRecoveryAmount = calculateAmount(basicSalary, formValues.advanceSalaryRecoveryType, formValues.advanceSalaryRecovery);
  const otherDeductionsAmount = calculateAmount(basicSalary, formValues.otherDeductionsType, formValues.otherDeductions);
  
  const totalDeductions = pfAmount + esiAmount + professionalTaxAmount + tdsAmount + 
    labourWelfareFundAmount + loanRecoveryAmount + advanceSalaryRecoveryAmount + otherDeductionsAmount;
  
  // Employer Contributions
  const employerPfAmount = calculateAmount(basicSalary, formValues.employerPfType, formValues.employerPf);
  const employerEsiAmount = calculateAmount(grossEarnings, formValues.employerEsiType, formValues.employerEsi);
  const gratuityAmount = calculateAmount(basicSalary, formValues.gratuityType, formValues.gratuity);
  const insuranceAmount = calculateAmount(basicSalary, formValues.insuranceType, formValues.insurance);
  
  const employerContribution = employerPfAmount + employerEsiAmount + gratuityAmount + insuranceAmount;
  
  // Final calculations
  const netSalary = grossEarnings - totalDeductions;
  const monthlyCTC = grossEarnings + employerContribution;
  const annualCTC = monthlyCTC * 12;

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setValue('employeeId', employee.id);
    setShowEmployeeSearch(false);
    setSearchTerm('');
  };

  // Mutation for creating/updating
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        employeeId: data.employeeId,
        basicSalary: data.basicSalary,
        hra: hraAmount,
        specialAllowance: specialAllowanceAmount,
        medicalAllowance: medicalAllowanceAmount,
        conveyance: conveyanceAmount,
        otherAllowances: foodAllowanceAmount + telephoneAllowanceAmount + internetAllowanceAmount + 
          bonusAmount + overtimeAmount + performanceIncentiveAmount + otherAllowancesAmount,
        pf: pfAmount,
        esi: esiAmount,
        professionalTax: professionalTaxAmount,
        tds: tdsAmount,
        otherDeductions: labourWelfareFundAmount + loanRecoveryAmount + advanceSalaryRecoveryAmount + otherDeductionsAmount,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || null,
        remarks: data.remarks || null,
      };

      if (initialData?.id) {
        return await api.put(`/salary-structure/${initialData.id}`, payload);
      }
      return await api.post('/salary-structure', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structure-stats'] });
      toast.success(initialData?.id ? 'Salary structure updated successfully!' : 'Salary structure created successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save salary structure');
    },
  });

  const onSubmit = (data: SalaryStructureFormData) => {
    saveMutation.mutate(data);
  };

  // Component for amount input with type toggle
  const AmountField = ({ 
    label, 
    valueName, 
    typeName, 
    icon 
  }: { 
    label: string; 
    valueName: any; 
    typeName: any; 
    icon: React.ReactNode;
  }) => {
    const type = watch(typeName);
    const value = watch(valueName);
    const calculatedAmount = calculateAmount(basicSalary, type, value);

    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
          {icon}
          {label}
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <input
              type="number"
              step="0.01"
              {...register(valueName, { valueAsNumber: true })}
              className="flex-1 px-4 py-2.5 bg-transparent text-white text-sm focus:outline-none"
              placeholder="0"
            />
            <select
              {...register(typeName)}
              className="px-3 py-2.5 bg-neutral-800 border-l border-neutral-700 text-white text-sm cursor-pointer focus:outline-none"
            >
              <option value="fixed">₹</option>
              <option value="percentage">%</option>
            </select>
          </div>
          {calculatedAmount > 0 && (
            <div className="text-sm font-mono text-emerald-400 min-w-[100px] text-right">
              ₹{calculatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
        {errors[valueName as keyof typeof errors] && (
          <p className="text-xs text-red-400">{errors[valueName as keyof typeof errors]?.message?.toString()}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        
        {/* SECTION 1: Employee Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Employee Information
          </h3>

          {/* Employee Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">
              Employee <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmployeeSearch(!showEmployeeSearch)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-left text-white text-sm hover:border-neutral-700 transition-colors flex items-center justify-between"
              >
                {selectedEmployee ? (
                  <span>{selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeId})</span>
                ) : (
                  <span className="text-neutral-500">Search employee...</span>
                )}
                <Search className="w-4 h-4 text-neutral-500" />
              </button>

              {showEmployeeSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                  <div className="p-3 border-b border-neutral-800">
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {employees && employees.length > 0 ? (
                      employees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleEmployeeSelect(emp)}
                          className="w-full px-4 py-3 text-left hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-0"
                        >
                          <div className="text-sm font-medium text-white">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {emp.employeeId} • {emp.departmentName} • {emp.designationTitle}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-neutral-500">
                        {searchTerm ? 'No employees found' : 'Start typing to search'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.employeeId && (
              <p className="text-xs text-red-400">{errors.employeeId.message}</p>
            )}
          </div>

          {/* Employee Details (Read-only) */}
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Employee ID</div>
                <div className="text-sm text-white font-mono">{selectedEmployee.employeeId}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Department</div>
                <div className="text-sm text-white">{selectedEmployee.departmentName}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Designation</div>
                <div className="text-sm text-white">{selectedEmployee.designationTitle}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase font-semibold mb-1">Joining Date</div>
                <div className="text-sm text-white">
                  {new Date(selectedEmployee.joiningDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Effective Date & Template */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Effective From <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                {...register('effectiveFrom')}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.effectiveFrom && (
                <p className="text-xs text-red-400">{errors.effectiveFrom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-300">
                Salary Template
              </label>
              <select
                {...register('template')}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">No Template</option>
                <option value="standard">Standard Package</option>
                <option value="senior">Senior Package</option>
                <option value="executive">Executive Package</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Earnings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Earnings
          </h3>

          {/* Basic Salary */}
          <div className="space-y-2 pb-4 border-b border-neutral-800">
            <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Basic Salary <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('basicSalary', { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter basic salary"
            />
            {errors.basicSalary && (
              <p className="text-xs text-red-400">{errors.basicSalary.message}</p>
            )}
          </div>

          {/* Allowances Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AmountField 
              label="House Rent Allowance (HRA)" 
              valueName="hra" 
              typeName="hraType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Special Allowance" 
              valueName="specialAllowance" 
              typeName="specialAllowanceType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Medical Allowance" 
              valueName="medicalAllowance" 
              typeName="medicalAllowanceType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Travel Allowance" 
              valueName="conveyance" 
              typeName="conveyanceType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Food Allowance" 
              valueName="foodAllowance" 
              typeName="foodAllowanceType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Telephone Allowance" 
              valueName="telephoneAllowance" 
              typeName="telephoneAllowanceType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Internet Allowance" 
              valueName="internetAllowance" 
              typeName="internetAllowanceType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Bonus" 
              valueName="bonus" 
              typeName="bonusType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Overtime" 
              valueName="overtime" 
              typeName="overtimeType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Performance Incentive" 
              valueName="performanceIncentive" 
              typeName="performanceIncentiveType"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <AmountField 
              label="Other Earnings" 
              valueName="otherAllowances" 
              typeName="otherAllowancesType"
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* SECTION 3: Deductions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Deductions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AmountField 
              label="Provident Fund (PF)" 
              valueName="pf" 
              typeName="pfType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="ESI" 
              valueName="esi" 
              typeName="esiType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="Professional Tax" 
              valueName="professionalTax" 
              typeName="professionalTaxType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="Income Tax (TDS)" 
              valueName="tds" 
              typeName="tdsType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="Labour Welfare Fund" 
              valueName="labourWelfareFund" 
              typeName="labourWelfareFundType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="Loan Recovery" 
              valueName="loanRecovery" 
              typeName="loanRecoveryType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="Advance Salary Recovery" 
              valueName="advanceSalaryRecovery" 
              typeName="advanceSalaryRecoveryType"
              icon={<Minus className="w-4 h-4" />}
            />
            <AmountField 
              label="Other Deduction" 
              valueName="otherDeductions" 
              typeName="otherDeductionsType"
              icon={<Minus className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* SECTION 4: Employer Contribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Employer Contribution
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AmountField 
              label="Employer PF" 
              valueName="employerPf" 
              typeName="employerPfType"
              icon={<Plus className="w-4 h-4" />}
            />
            <AmountField 
              label="Employer ESI" 
              valueName="employerEsi" 
              typeName="employerEsiType"
              icon={<Plus className="w-4 h-4" />}
            />
            <AmountField 
              label="Gratuity" 
              valueName="gratuity" 
              typeName="gratuityType"
              icon={<Plus className="w-4 h-4" />}
            />
            <AmountField 
              label="Insurance" 
              valueName="insurance" 
              typeName="insuranceType"
              icon={<Plus className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* SECTION 5: Live Calculation */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            Summary & Calculation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gross Earnings */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div className="text-xs font-semibold text-emerald-400 uppercase">Gross Earnings</div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ₹{grossEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Monthly</div>
            </div>

            {/* Total Deductions */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <div className="text-xs font-semibold text-red-400 uppercase">Total Deductions</div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ₹{totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Monthly</div>
            </div>

            {/* Employer Contribution */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <div className="text-xs font-semibold text-purple-400 uppercase">Employer Contribution</div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ₹{employerContribution.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Monthly</div>
            </div>
          </div>

          {/* Net Salary & CTC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <div className="text-xs font-semibold text-blue-400 uppercase">Net Salary</div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ₹{netSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Take Home (Monthly)</div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                <div className="text-xs font-semibold text-indigo-400 uppercase">Monthly CTC</div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ₹{monthlyCTC.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-1">Cost to Company</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <div className="text-xs font-semibold text-blue-400 uppercase">Annual CTC</div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                ₹{(annualCTC / 100000).toFixed(2)}L
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                ₹{annualCTC.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: Notes */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Notes & Remarks
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">
              Additional Notes
            </label>
            <textarea
              {...register('remarks')}
              rows={4}
              placeholder="Add any additional notes or remarks about this salary structure..."
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-600 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons - Sticky */}
      <div className="sticky bottom-0 bg-neutral-950 border-t border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saveMutation.isPending}
            className="flex-1 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saveMutation.isPending || !selectedEmployee || !formValues.basicSalary}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {initialData?.id ? 'Update Structure' : 'Save Structure'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
