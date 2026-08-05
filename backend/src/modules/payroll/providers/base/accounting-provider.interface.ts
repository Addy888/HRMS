/**
 * ACCOUNTING PROVIDER INTERFACE
 * 
 * Abstracts accounting/ERP integration from Payroll Engine.
 * 
 * This allows integration with:
 * - Tally
 * - Zoho Books
 * - QuickBooks
 * - SAP
 * - Oracle ERP
 * - Dynamics 365
 * - NetSuite
 * - Custom accounting systems
 * 
 * WITHOUT CHANGING PAYROLL LOGIC!
 * 
 * Future Implementations:
 * - TallyAccountingProvider
 * - ZohoBooksProvider
 * - QuickBooksProvider
 * - SAPProvider
 * - OracleERPProvider
 * - ManualAccountingProvider (exports to CSV/Excel)
 */

import { IAccountingEntry, IBankTransferData } from '../../interfaces/payroll-data.interface';

export interface IAccountingProvider {
  /**
   * Provider name
   */
  getName(): string;

  /**
   * Post salary entry to accounting system
   */
  postSalaryEntry(entry: IAccountingEntry): Promise<{ success: boolean; voucherNumber?: string; error?: string }>;

  /**
   * Post bulk salary entries
   */
  postBulkSalaryEntries(entries: IAccountingEntry[]): Promise<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors?: string[];
  }>;

  /**
   * Generate bank transfer file
   */
  generateBankTransferFile(
    transfers: IBankTransferData[],
    bankCode: string, // ICICI, HDFC, SBI, AXIS
  ): Promise<{ success: boolean; fileUrl?: string; error?: string }>;

  /**
   * Sync payroll data with accounting system
   */
  syncPayrollData(
    month: number,
    year: number,
  ): Promise<{ success: boolean; message?: string }>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
