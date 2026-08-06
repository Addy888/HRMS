/**
 * MANUAL ATTENDANCE PROVIDER
 *
 * Implementation of IAttendanceProvider for manual attendance entry.
 * This is the DEFAULT provider for the system.
 *
 * FEATURES:
 * - Web-based check-in/check-out
 * - Mobile app attendance
 * - HR manual entry
 * - No device dependency
 * - Real-time processing
 *
 * FUTURE PROVIDERS (examples):
 * - BiometricAttendanceProvider (fingerprint devices)
 * - FaceRecognitionProvider (face recognition systems)
 * - RFIDProvider (RFID card readers)
 * - QRCodeProvider (QR code scanning)
 * - GPSAttendanceProvider (GPS-based mobile attendance)
 * - APIAttendanceProvider (third-party API integration)
 * - WebhookAttendanceProvider (webhook-based data push)
 *
 * All future providers will implement the SAME interface (IAttendanceProvider).
 * The AttendanceService doesn't need to know which provider is being used.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IAttendanceProvider,
  IProviderMetadata,
} from '../base/attendance.provider.interface';
import {
  IAttendanceEvent,
  IProviderConfiguration,
} from '../../interfaces/attendance-event.interface';
import { AttendanceSource, AttendanceEventType } from '../../enums';
import { AttendanceProviderRegistry } from '../provider.registry';

@Injectable()
export class ManualAttendanceProvider
  implements IAttendanceProvider, OnModuleInit
{
  private readonly logger = new Logger(ManualAttendanceProvider.name);
  private configuration: IProviderConfiguration = {
    isEnabled: true,
    autoSync: false, // Manual entry doesn't need sync
  };

  constructor(private readonly registry: AttendanceProviderRegistry) {}

  async onModuleInit() {
    // Auto-register this provider on module initialization
    this.registry.registerProvider(this, this.getMetadata());
    this.logger.log('Manual Attendance Provider initialized');
  }

  /**
   * PROVIDER IDENTITY
   */
  getName(): string {
    return 'MANUAL';
  }

  getSource(): AttendanceSource {
    return AttendanceSource.MANUAL;
  }

  /**
   * PROVIDER METADATA
   * Used by UI for display and configuration
   */
  private getMetadata(): IProviderMetadata {
    return {
      name: 'MANUAL',
      displayName: 'Manual Attendance',
      description: 'Manual attendance entry via web or mobile application',
      source: AttendanceSource.MANUAL,
      type: 'MANUAL',
      features: [
        'Web Check-in/Check-out',
        'Mobile Check-in/Check-out',
        'HR Manual Entry',
        'IP Address Tracking',
        'Location Tracking',
        'Real-time Processing',
      ],
      requiresDevice: false,
      supportsSync: false,
      supportsRealtime: true,
    };
  }

  /**
   * CHECK IF PROVIDER IS ACTIVE
   */
  async isActive(): Promise<boolean> {
    return this.configuration.isEnabled;
  }

  /**
   * INITIALIZE PROVIDER
   * Called when provider is first configured
   */
  async initialize(config: IProviderConfiguration): Promise<void> {
    this.logger.log('Initializing Manual Attendance Provider');
    this.configuration = { ...this.configuration, ...config };
    this.logger.log('Manual Attendance Provider initialized successfully');
  }

  /**
   * RECORD ATTENDANCE EVENT
   * This is the CORE method - called by AttendanceService
   */
  async recordAttendance(
    event: Partial<IAttendanceEvent>,
  ): Promise<IAttendanceEvent> {
    this.logger.debug(`Recording manual attendance: ${JSON.stringify(event)}`);

    // Validate the event
    await this.validateEvent(event);

    // Build complete attendance event
    const attendanceEvent: IAttendanceEvent = {
      employeeId: event.employeeId!,
      eventType: event.eventType!,
      timestamp: event.timestamp || new Date(),
      source: this.getSource(),
      deviceId: event.deviceId,
      deviceName: event.deviceName || 'Manual Entry',
      location: event.location,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      rawData: event.rawData || {},
    };

    this.logger.log(
      `Manual attendance recorded: ${attendanceEvent.employeeId} - ${attendanceEvent.eventType} at ${attendanceEvent.timestamp}`,
    );

    return attendanceEvent;
  }

  /**
   * VALIDATE ATTENDANCE EVENT
   * Provider-specific validation
   */
  async validateEvent(event: Partial<IAttendanceEvent>): Promise<boolean> {
    // Validate required fields
    if (!event.employeeId) {
      throw new Error('Employee ID is required for manual attendance');
    }

    if (!event.eventType) {
      throw new Error('Event type is required for manual attendance');
    }

    // Validate event type
    const validEventTypes = Object.values(AttendanceEventType);
    if (!validEventTypes.includes(event.eventType)) {
      throw new Error(
        `Invalid event type: ${event.eventType}. Must be one of: ${validEventTypes.join(', ')}`,
      );
    }

    // Validate timestamp (not in future)
    const timestamp = event.timestamp || new Date();
    if (timestamp > new Date()) {
      throw new Error('Attendance timestamp cannot be in the future');
    }

    // Validate timestamp (not older than 30 days for manual entry)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (timestamp < thirtyDaysAgo) {
      throw new Error(
        'Manual attendance cannot be recorded for dates older than 30 days',
      );
    }

    return true;
  }

  /**
   * HEALTH CHECK
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    // Manual provider is always healthy if enabled
    return {
      healthy: this.configuration.isEnabled,
      message: this.configuration.isEnabled
        ? 'Manual Attendance Provider is operational'
        : 'Manual Attendance Provider is disabled',
    };
  }

  /**
   * GET CONFIGURATION
   */
  getConfiguration(): IProviderConfiguration {
    return { ...this.configuration };
  }

  /**
   * UPDATE CONFIGURATION
   */
  async updateConfiguration(
    config: Partial<IProviderConfiguration>,
  ): Promise<void> {
    this.logger.log(`Updating configuration: ${JSON.stringify(config)}`);
    this.configuration = { ...this.configuration, ...config };
    this.logger.log('Configuration updated successfully');
  }

  /**
   * SYNC ATTENDANCE
   * Not applicable for manual provider, but implementing for interface compliance
   */
  async syncAttendance(
    startDate: Date,
    endDate: Date,
  ): Promise<IAttendanceEvent[]> {
    this.logger.warn('Sync not supported for manual attendance provider');
    return [];
  }
}
