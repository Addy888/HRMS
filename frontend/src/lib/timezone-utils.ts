/**
 * TIMEZONE UTILITIES FOR ATTENDANCE
 * 
 * CRITICAL: The HRMS attendance operates in Asia/Kolkata timezone.
 * All attendance calculations must use IST, not browser timezone.
 */

import { format as dateFnsFormat, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const ATTENDANCE_TIMEZONE = 'Asia/Kolkata';

/**
 * Format attendance time in IST timezone
 * @param timestamp - ISO string or Date
 * @param formatStr - date-fns format string
 * @returns Formatted time in IST
 */
export function formatAttendanceTime(timestamp: string | Date | null, formatStr = 'hh:mm a'): string {
  if (!timestamp) return '--:--';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    return formatInTimeZone(date, ATTENDANCE_TIMEZONE, formatStr);
  } catch (error) {
    console.error('Error formatting attendance time:', error);
    return '--:--';
  }
}

/**
 * Convert canonical attendance date (UTC) to IST calendar date
 * 
 * CRITICAL: This function maps the canonical database date to the correct
 * calendar date in Asia/Kolkata timezone.
 * 
 * Example:
 * Database: 2026-08-12T18:30:00.000Z
 * Represents: 13 August 2026 00:00:00 IST
 * Returns: "2026-08-13"
 * 
 * @param canonicalDate - The attendance date from database (ISO string)
 * @returns Calendar date in YYYY-MM-DD format (IST)
 */
export function getAttendanceCalendarDate(canonicalDate: string | Date): string {
  try {
    const date = typeof canonicalDate === 'string' ? parseISO(canonicalDate) : canonicalDate;
    
    // Convert to IST timezone to get the correct calendar date
    const istDate = toZonedTime(date, ATTENDANCE_TIMEZONE);
    
    // Format as YYYY-MM-DD in IST
    return dateFnsFormat(istDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting attendance calendar date:', error);
    return '';
  }
}

/**
 * Format working hours in HHh MMm format
 * @param hours - Working hours as decimal (e.g., 9.5)
 * @returns Formatted string (e.g., "09h 30m")
 */
export function formatWorkingHours(hours: number | null | undefined): string {
  if (!hours || hours <= 0) return '--h --m';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Get current IST time
 * @returns Current date in IST timezone
 */
export function getCurrentISTTime(): Date {
  return toZonedTime(new Date(), ATTENDANCE_TIMEZONE);
}

/**
 * Format date for display in IST
 * @param date - Date to format
 * @param formatStr - Format string
 * @returns Formatted date in IST
 */
export function formatISTDate(date: Date | string, formatStr: string): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(d, ATTENDANCE_TIMEZONE, formatStr);
  } catch (error) {
    console.error('Error formatting IST date:', error);
    return '';
  }
}
