/**
 * ATTENDANCE PROVIDER INTERFACE
 *
 * This interface abstracts attendance data access from the Payroll Engine.
 *
 * CRITICAL: Payroll Engine NEVER directly queries Attendance tables.
 * Instead, it uses this interface.
 *
 * This allows:
 * - Switching from internal Attendance to external Biometric systems
 * - Integration with third-party Time & Attendance systems
 * - Multiple attendance sources without changing payroll logic
 *
 * Future Implementations:
 * - InternalAttendanceProvider (uses our Attendance module)
 * - BiometricAttendanceProvider (ZKTeco, eSSL, etc.)
 * - ExternalAPIAttendanceProvider (ADP, Workday, etc.)
 * - ManualAttendanceProvider (for special cases)
 */

import { IAttendanceData } from '../../interfaces/payroll-data.interface';

export interface IAttendanceProvider {
  /**
   * Provider name
   */
  getName(): string;

  /**
   * Get attendance data for an employee for a specific month
   */
  getAttendanceData(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<IAttendanceData>;

  /**
   * Get attendance data for multiple employees
   */
  getBulkAttendanceData(
    employeeIds: string[],
    month: number,
    year: number,
  ): Promise<Map<string, IAttendanceData>>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
