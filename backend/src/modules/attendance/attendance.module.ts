/**
 * ATTENDANCE MODULE
 * 
 * Complete attendance management system with provider-based architecture
 * 
 * FEATURES:
 * - Multiple attendance sources (Manual, Biometric, RFID, Face Recognition, QR, GPS, API)
 * - Provider pattern for extensibility
 * - Shift management
 * - Holiday management
 * - Attendance corrections
 * - Real-time and scheduled sync
 * - Comprehensive reporting
 * - Audit logging
 * 
 * ARCHITECTURE:
 * - IAttendanceProvider interface for all providers
 * - AttendanceProviderRegistry for provider management
 * - AttendanceService for business logic
 * - Controllers for API endpoints
 * 
 * TO ADD NEW PROVIDER:
 * 1. Create provider class implementing IAttendanceProvider
 * 2. Add to providers array below
 * 3. Provider auto-registers on module init
 * 4. No changes needed to business logic
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';

// Services
import { AttendanceService } from './services/attendance.service';
import { ShiftService } from './services/shift.service';

// Controllers
import { AttendanceController } from './controllers/attendance.controller';

// Providers
import { AttendanceProviderRegistry } from './providers/provider.registry';
import { ManualAttendanceProvider } from './providers/manual/manual-attendance.provider';

// Future providers (uncomment when implemented):
// import { BiometricAttendanceProvider } from './providers/biometric/biometric-attendance.provider';
// import { FaceRecognitionProvider } from './providers/face-recognition/face-recognition.provider';
// import { RFIDProvider } from './providers/rfid/rfid.provider';
// import { QRCodeProvider } from './providers/qrcode/qrcode.provider';
// import { GPSAttendanceProvider } from './providers/gps/gps-attendance.provider';
// import { APIAttendanceProvider } from './providers/api/api-attendance.provider';
// import { WebhookAttendanceProvider } from './providers/webhook/webhook-attendance.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AttendanceController,
    // Additional controllers can be added here:
    // ShiftController,
    // HolidayController,
    // AttendanceCorrectionController,
    // DeviceController,
    // SyncController,
  ],
  providers: [
    // Core Services
    AttendanceService,
    ShiftService,
    
    // Provider Registry (Factory)
    AttendanceProviderRegistry,
    
    // Attendance Providers (Strategy Pattern)
    ManualAttendanceProvider,
    // BiometricAttendanceProvider, // Future
    // FaceRecognitionProvider, // Future
    // RFIDProvider, // Future
    // QRCodeProvider, // Future
    // GPSAttendanceProvider, // Future
    // APIAttendanceProvider, // Future
    // WebhookAttendanceProvider, // Future
    
    // Additional services can be added here:
    // HolidayService,
    // AttendanceCorrectionService,
    // DeviceService,
    // SyncService,
    // AttendanceCalculationService,
    // AttendanceReportService,
  ],
  exports: [
    AttendanceService,
    ShiftService,
    AttendanceProviderRegistry,
  ],
})
export class AttendanceModule {}
