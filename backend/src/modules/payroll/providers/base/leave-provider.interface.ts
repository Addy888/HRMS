/**
 * LEAVE PROVIDER INTERFACE
 *
 * Abstracts leave data access from Payroll Engine.
 *
 * Future Implementations:
 * - InternalLeaveProvider (uses our Leave module - Phase 11)
 * - ExternalLeaveProvider (integrates with third-party leave systems)
 * - ManualLeaveProvider (for manual leave entry)
 */

import { ILeaveData } from '../../interfaces/payroll-data.interface';

export interface ILeaveProvider {
  /**
   * Provider name
   */
  getName(): string;

  /**
   * Get leave data for an employee for a specific month
   */
  getLeaveData(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<ILeaveData>;

  /**
   * Get leave data for multiple employees
   */
  getBulkLeaveData(
    employeeIds: string[],
    month: number,
    year: number,
  ): Promise<Map<string, ILeaveData>>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
