/**
 * Attendance Status Enum
 * Defines all possible attendance statuses in the system
 */
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
  LEAVE = 'LEAVE',
  WFH = 'WFH', // Work From Home
  ON_DUTY = 'ON_DUTY',
  MISSED_PUNCH = 'MISSED_PUNCH',
}
