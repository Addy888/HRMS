/**
 * Device Status Enum
 * Defines possible device connection states
 */
export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR',
}

/**
 * Sync Status Enum
 * Status of attendance data sync
 */
export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
}

/**
 * Sync Type Enum
 * Method of sync trigger
 */
export enum SyncType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  WEBHOOK = 'WEBHOOK',
}
