/**
 * ATTENDANCE DATE UTILITY
 * 
 * CRITICAL: This module provides the SINGLE source of truth for attendance date normalization.
 * 
 * BUSINESS RULE:
 * The HRMS attendance operates in Asia/Kolkata timezone.
 * For attendance purposes, "date" means the Indian calendar day.
 * 
 * Example:
 * - 13 August 2026 in India (any time) must ALWAYS map to ONE canonical DateTime value
 * - That canonical value represents: 13 August 2026 00:00:00 IST
 * - Which converts to UTC as: 2026-08-12T18:30:00.000Z
 * 
 * USAGE:
 * Every attendance database operation MUST use this utility to ensure consistency:
 * - Check-in lookup
 * - Check-in create
 * - Check-out lookup
 * - Attendance history
 * - Attendance summary
 * - Manual attendance
 * - Reports
 * 
 * DO NOT:
 * - Use new Date().setHours(0,0,0,0) directly
 * - Use different date functions in different attendance methods
 * - Mix local Date and UTC Date
 * - Use browser timezone
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay as startOfDayFns } from 'date-fns';

/**
 * Business timezone for attendance operations
 */
const ATTENDANCE_TIMEZONE = 'Asia/Kolkata';

/**
 * Get the canonical attendance business date for database storage
 * 
 * CRITICAL: The database column is @db.Date but Prisma expects DateTime type.
 * We must pass a Date object, but ensure it represents the correct calendar date.
 * 
 * This function returns a Date object at midnight UTC that represents
 * the business date (calendar day in Asia/Kolkata).
 * 
 * The EXACT SAME date value MUST be used for:
 * - findUnique lookup
 * - create operation
 * - update operation
 * 
 * @param inputDate - Optional input date (defaults to current server time)
 * @returns Date object at midnight UTC representing the IST business date
 * 
 * @example
 * // Server time: 2026-08-14 16:00 IST (2026-08-14T10:30:00Z)
 * const businessDate = getAttendanceBusinessDate();
 * // Returns: Date object for 2026-08-14 00:00:00 UTC
 * // MySQL stores: 2026-08-14 (DATE only)
 */
export function getAttendanceBusinessDate(inputDate?: Date | string): Date {
  // STEP 1: Parse input date or use current server time
  const sourceDate = inputDate ? new Date(inputDate) : new Date();
  
  // STEP 2: Convert to Asia/Kolkata timezone to get the local calendar date
  const zonedDate = toZonedTime(sourceDate, ATTENDANCE_TIMEZONE);
  
  // STEP 3: Extract date components in IST
  const year = zonedDate.getFullYear();
  const month = zonedDate.getMonth(); // 0-11
  const day = zonedDate.getDate();
  
  // STEP 4: Create Date object at midnight UTC for this calendar date
  // This ensures MySQL @db.Date column stores the correct date
  const businessDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  return businessDate;
}

/**
 * Get canonical start and end of day boundaries for date range queries
 * 
 * @param inputDate - Input date
 * @returns Object with start and end Date objects
 */
export function getAttendanceDayBoundaries(inputDate?: Date | string): {
  start: Date;
  end: Date;
} {
  const businessDate = getAttendanceBusinessDate(inputDate);
  
  return {
    start: businessDate,
    end: businessDate,
  };
}

/**
 * Format attendance date for logging
 * Shows the date
 */
export function formatAttendanceDateLog(date: string | Date): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
}

/**
 * Get current Indian calendar date components
 * Useful for debugging and logging
 */
export function getIndianCalendarDate(inputDate?: Date): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: string;
} {
  const sourceDate = inputDate ? new Date(inputDate) : new Date();
  const zonedDate = toZonedTime(sourceDate, ATTENDANCE_TIMEZONE);
  
  return {
    year: zonedDate.getFullYear(),
    month: zonedDate.getMonth() + 1,
    day: zonedDate.getDate(),
    dayOfWeek: zonedDate.toLocaleString('en-IN', { weekday: 'long', timeZone: ATTENDANCE_TIMEZONE }),
  };
}
