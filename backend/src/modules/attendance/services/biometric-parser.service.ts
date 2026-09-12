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
      const row = data[i];
      
      // Check if this is an employee header row
      if (this.isEmployeeHeaderRow(row)) {
        const biometricNo = this.extractBiometricNo(row);
        const name = this.extractName(row);
        
        // Next row contains punches
        const punchRow = data[i + 1];
        const punches = this.extractPunches(punchRow);

        employees.push({
          biometricNo,
          name,
          punches,
        });

        this.logger.log(`[BIOMETRIC-PARSE] No: ${biometricNo}, Name: ${name}, Days: ${punches.size}`);
      }
    }

    return employees;
  }

  /**
   * Check if row is employee header (contains "No :" and "Name :")
   */
  private isEmployeeHeaderRow(row: any[]): boolean {
    const rowStr = JSON.stringify(row).toLowerCase();
    return rowStr.includes('no :') && rowStr.includes('name :');
  }

  /**
   * Extract biometric number from row
   * Format: ["No :", "", "5", "", "", "", "", "", "Name :", "", "sumaiyya"]
   */
  private extractBiometricNo(row: any[]): string {
    for (let i = 0; i < row.length; i++) {
      const cell = (row[i] || '').toString().toLowerCase();
      if (cell === 'no :' || cell === 'no:') {
        // Biometric number is typically 2 cells to the right
        if (i + 2 < row.length) {
          const no = (row[i + 2] || '').toString().trim();
          if (no) return no;
        }
      }
    }
    return '';
  }

  /**
   * Extract name from row
   * Format: ["No :", "", "5", "", "", "", "", "", "Name :", "", "sumaiyya"]
   */
  private extractName(row: any[]): string {
    for (let i = 0; i < row.length; i++) {
      const cell = (row[i] || '').toString().toLowerCase();
      if (cell === 'name :' || cell === 'name:') {
        // Name is typically 2 cells to the right
        if (i + 2 < row.length) {
          const name = (row[i + 2] || '').toString().trim();
          if (name) return name;
        }
      }
    }
    return '';
  }

  /**
   * Extract punches from punch row
   * Cells 0-11 represent days 1-12 (or however many days in period)
   * Each cell contains multiline punch times like "08:53\r\n18:06\r\n"
   */
  private extractPunches(row: any[]): Map<number, string[]> {
    const punches = new Map<number, string[]>();

    // Skip first 2 columns (usually empty), then process day columns
    // Days are in columns 2-13 (representing days 1-12)
    for (let col = 2; col < Math.min(14, row.length); col++) {
      const dayNum = col - 1; // Column 2 = day 1
      const cell = (row[col] || '').toString().trim();
      
      if (cell) {
        // Split by newlines and extract times
        const times = cell
          .split(/[\r\n]+/)
          .map(t => t.trim())
          .filter(t => /^\d{1,2}:\d{2}$/.test(t));
        
        if (times.length > 0) {
          punches.set(dayNum, times);
        }
      }
    }

    return punches;
  }
}
