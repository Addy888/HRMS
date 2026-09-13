/**
 * BIOMETRIC EXCEL PARSER
 * Parses the actual biometric Excel format with employee blocks
 */

import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface BiometricEmployee {
  biometricNo: string;
  name: string;
  punches: Map<number, string[]>; // day -> punch times
}

export interface BiometricPeriod {
  startYear: number;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
}

@Injectable()
export class BiometricParserService {
  private readonly logger = new Logger(BiometricParserService.name);

  /**
   * Parse biometric Excel file
   */
  parseBiometricExcel(fileBuffer: Buffer): {
    period: BiometricPeriod;
    employees: BiometricEmployee[];
  } {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to array format
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    });

    this.logger.log(`Parsed ${data.length} rows from Excel`);

    // Extract Period
    const period = this.extractPeriod(data);
    this.logger.log(`Period: ${period.startYear}/${period.startMonth}/${period.startDay} ~ ${period.endMonth}/${period.endDay}`);

    // Extract employee blocks
    const employees = this.extractEmployeeBlocks(data);
    this.logger.log(`Found ${employees.length} employees`);

    return { period, employees };
  }

  /**
   * Extract period from Excel
   * Format: "2026/09/01 ~ 09/12	( fcs )"
   */
  private extractPeriod(data: any[][]): BiometricPeriod {
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      for (const cell of row) {
        const cellStr = cell?.toString() || '';
        
        // Match pattern: YYYY/MM/DD ~ MM/DD
        const match = cellStr.match(/(\d{4})\/(\d{2})\/(\d{2})\s*~\s*(\d{2})\/(\d{2})/);
        if (match) {
          return {
            startYear: parseInt(match[1]),
            startMonth: parseInt(match[2]),
            startDay: parseInt(match[3]),
            endYear: parseInt(match[1]), // Same year
            endMonth: parseInt(match[4]),
            endDay: parseInt(match[5]),
          };
        }
      }
    }

    throw new Error('Could not find Period in Excel');
  }

  /**
   * Extract employee blocks
   * Each block: Row with "No :" and "Name :", followed by punch row
   */
  private extractEmployeeBlocks(data: any[][]): BiometricEmployee[] {
    const employees: BiometricEmployee[] = [];

    for (let i = 0; i < data.length - 1; i++) {
      const row = data[i] || [];
      if (!this.isEmployeeHeaderRow(row)) continue;

      const biometricNo = this.extractBiometricNo(row);
      const name = this.extractName(row);

      const punchRow = data[i + 1] || [];
      const dayHeaderRow = data[i - 1] || [];
      const punches = this.extractPunches(punchRow, dayHeaderRow);

      if (!biometricNo && !name && punches.size === 0) continue;

      employees.push({ biometricNo, name, punches });
      this.logger.log(`[BIOMETRIC-PARSE] No: ${biometricNo}, Name: ${name}, Days: ${punches.size}`);
    }

    return employees;
  }

  /**
   * Check if row is employee header (contains "No :" and "Name :")
   */
  private isEmployeeHeaderRow(row: any[]): boolean {
    if (!Array.isArray(row)) return false;
    const rowStr = row
      .map(cell => (cell ?? '').toString().trim().toLowerCase())
      .join(' ');
    return rowStr.includes('no :') || rowStr.includes('no:') || rowStr.includes('name :') || rowStr.includes('name:');
  }

  /**
   * Extract biometric number from row
   * Supports: "No : 2", "No: 2", "No : 2 Name : aditya" layouts
   */
  private extractBiometricNo(row: any[]): string {
    for (let i = 0; i < row.length; i++) {
      const cell = (row[i] ?? '').toString().trim();
      const normalized = cell.toLowerCase().replace(/\s+/g, ' ');

      if (normalized === 'no :' || normalized === 'no:' || normalized === 'no') {
        for (let j = i + 1; j < row.length; j++) {
          const candidate = (row[j] ?? '').toString().trim();
          if (!candidate) continue;
          const cleaned = candidate.replace(/[^0-9]/g, '');
          if (cleaned) return cleaned;
        }
      }
    }

    return '';
  }

  /**
   * Extract name from row
   * Supports: "Name : aditya", "Name: aditya", or label/value separated by blanks
   */
  private extractName(row: any[]): string {
    for (let i = 0; i < row.length; i++) {
      const cell = (row[i] ?? '').toString().trim();
      const normalized = cell.toLowerCase().replace(/\s+/g, ' ');

      if (normalized === 'name :' || normalized === 'name:' || normalized === 'name') {
        for (let j = i + 1; j < row.length; j++) {
          const candidate = (row[j] ?? '').toString().trim();
          if (!candidate) continue;
          if (/^\d+$/.test(candidate)) continue;
          return candidate;
        }
      }
    }

    return '';
  }

  /**
   * Extract punches from punch row
   * Cells may include multiple values per day in newline/space-separated format.
   */
  private extractPunches(row: any[], dayHeaderRow: any[]): Map<number, string[]> {
    const punches = new Map<number, string[]>();

    for (let col = 0; col < row.length; col++) {
      const cellValue = (row[col] ?? '').toString().trim();
      if (!cellValue) continue;

      const times = this.extractTimesFromCell(cellValue);
      if (times.length === 0) continue;

      const dayNum = parseInt(String(dayHeaderRow[col] ?? '').trim(), 10);
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) continue;
      punches.set(dayNum, times);
    }

    return punches;
  }

  private extractTimesFromCell(cell: string): string[] {
    return cell
      .replace(/\r/g, '\n')
      .split(/\n+/)
      .flatMap(part => part.split(/\s+/))
      .map(value => value.trim())
      .filter(value => /^\d{1,2}:\d{2}$/.test(value));
  }
}
