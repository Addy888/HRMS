/**
 * Attendance Event Interface
 * Represents a single attendance event from any source
 */
import { AttendanceEventType, AttendanceSource } from '../enums';

export interface IAttendanceEvent {
  employeeId: string;
  eventType: AttendanceEventType;
  timestamp: Date;
  source: AttendanceSource;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  rawData?: Record<string, any>;
}

/**
 * Provider Configuration Interface
 * Base configuration for all providers
 */
export interface IProviderConfiguration {
  isEnabled: boolean;
  autoSync?: boolean;
  syncInterval?: number; // in minutes
  [key: string]: any; // Allow provider-specific configs
}

/**
 * Attendance Data Interface
 * Processed attendance data for a day
 */
export interface IAttendanceData {
  employeeId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  workingHours?: number;
  breakTime?: number;
  overtime?: number;
  status: string;
  lateBy?: number;
  earlyExitBy?: number;
  source: AttendanceSource;
  deviceType?: string;
  location?: string;
  ipAddress?: string;
  remarks?: string;
}
