/**
 * ATTENDANCE PROVIDER INTERFACE
 *
 * This is the CORE ABSTRACTION that enables the provider pattern.
 *
 * ALL attendance providers (Manual, Biometric, RFID, Face Recognition, QR Code,
 * GPS, API, Webhook) MUST implement this interface.
 *
 * The AttendanceService communicates ONLY with this interface, never with
 * concrete implementations. This follows the Open/Closed Principle - the system
 * is open for extension (new providers) but closed for modification (business logic).
 *
 * IMPORTANT: When adding a new provider:
 * 1. Create a new class implementing IAttendanceProvider
 * 2. Register it in the provider registry
 * 3. NO changes needed to AttendanceService or business logic
 */

import {
  IAttendanceEvent,
  IProviderConfiguration,
} from '../../interfaces/attendance-event.interface';
import { AttendanceSource } from '../../enums';

export interface IAttendanceProvider {
  /**
   * Unique provider name (MANUAL, BIOMETRIC, RFID, etc.)
   */
  getName(): string;

  /**
   * Provider source type
   */
  getSource(): AttendanceSource;

  /**
   * Check if provider is currently active and available
   */
  isActive(): Promise<boolean>;

  /**
   * Initialize provider with configuration
   * Called when provider is activated
   */
  initialize(config: IProviderConfiguration): Promise<void>;

  /**
   * Record an attendance event (check-in, check-out)
   * This is the PRIMARY method called by business logic
   *
   * @param event - Attendance event data
   * @returns Promise<IAttendanceEvent> - Validated and processed event
   */
  recordAttendance(event: Partial<IAttendanceEvent>): Promise<IAttendanceEvent>;

  /**
   * Validate attendance event before processing
   * Provider-specific validation logic
   *
   * @param event - Event to validate
   * @returns Promise<boolean> - true if valid
   * @throws Error if validation fails
   */
  validateEvent(event: Partial<IAttendanceEvent>): Promise<boolean>;

  /**
   * Sync attendance data from external source
   * Used by device-based providers (Biometric, RFID, etc.)
   * Optional for manual providers
   *
   * @param startDate - Sync from date
   * @param endDate - Sync to date
   * @returns Promise<IAttendanceEvent[]> - Synced events
   */
  syncAttendance?(startDate: Date, endDate: Date): Promise<IAttendanceEvent[]>;

  /**
   * Health check for provider
   * Used to monitor provider status
   *
   * @returns Promise<{ healthy: boolean; message?: string }>
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;

  /**
   * Get provider configuration
   */
  getConfiguration(): IProviderConfiguration;

  /**
   * Update provider configuration
   */
  updateConfiguration(config: Partial<IProviderConfiguration>): Promise<void>;
}

/**
 * PROVIDER METADATA
 * Information about a provider for registry and UI
 */
export interface IProviderMetadata {
  name: string;
  displayName: string;
  description: string;
  source: AttendanceSource;
  type: string; // MANUAL, DEVICE, SOFTWARE, API
  features: string[]; // List of supported features
  requiresDevice: boolean;
  supportsSync: boolean;
  supportsRealtime: boolean;
}
