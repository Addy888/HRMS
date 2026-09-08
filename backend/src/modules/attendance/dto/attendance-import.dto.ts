import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Excel Row Import Result
 */
export interface ExcelRowImportResult {
  rowNumber: number;
  employeeId: string;
  date?: string; // Optional now
  checkIn?: string;
  checkOut?: string;
  status?: string;
  success: boolean;
  error?: string;
  isDuplicate?: boolean;
  employeeFound?: boolean;
  employeeName?: string;
  rawData?: string; // ✅ NEW: Complete row as JSON
  matchedEmployeeUUID?: string; // ✅ NEW: Matched employee UUID
}

/**
 * Import Preview Response
 */
export interface AttendanceImportPreviewDto {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  employeesFound: number;
  employeesNotFound: number;
  results: ExcelRowImportResult[];
  warnings: string[];
}

/**
 * Import Confirmation Request
 */
export class ConfirmImportDto {
  @ApiProperty({ description: 'Temporary file ID or path', required: false })
  @IsString()
  @IsOptional()
  fileId?: string;

  @ApiProperty({ description: 'Import session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

/**
 * Import History Query
 */
export class GetImportHistoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  endDate?: string;
}

/**
 * Excel Template Row Interface
 */
export interface ExcelTemplateRow {
  'Employee ID': string;
  'Date': string;
  'Check In': string;
  'Check Out': string;
  'Status': string;
}
