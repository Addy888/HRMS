/**
 * TAX PROVIDER INTERFACE
 *
 * Abstracts tax calculations from Payroll Engine.
 *
 * This allows:
 * - Different tax rules for different regions/countries
 * - Integration with external tax calculation services
 * - Easy updates when tax laws change
 *
 * Future Implementations:
 * - IndianTaxProvider (Indian PF, ESI, PT, TDS rules)
 * - USTaxProvider (US Federal, State, Social Security)
 * - UKTaxProvider (UK PAYE, NI)
 * - ExternalTaxAPIProvider (integrates with tax calculation APIs)
 */

import { ITaxData } from '../../interfaces/payroll-data.interface';

export interface ITaxProvider {
  /**
   * Provider name
   */
  getName(): string;

  /**
   * Calculate taxes for an employee
   */
  calculateTax(
    employeeId: string,
    grossSalary: number,
    month: number,
    year: number,
  ): Promise<ITaxData>;

  /**
   * Calculate taxes for multiple employees
   */
  calculateBulkTax(
    employees: Array<{ employeeId: string; grossSalary: number }>,
    month: number,
    year: number,
  ): Promise<Map<string, ITaxData>>;

  /**
   * Get tax configuration (rates, slabs, etc.)
   */
  getTaxConfiguration(): Promise<any>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
