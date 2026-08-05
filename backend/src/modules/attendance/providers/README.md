# Attendance Providers

## Architecture Overview

This directory contains all attendance provider implementations following the **Provider Pattern**.

### Core Principle
The attendance system communicates ONLY with the `IAttendanceProvider` interface, never with concrete implementations. This allows adding new attendance sources without modifying business logic.

## Current Providers

### 1. ManualAttendanceProvider ✅ IMPLEMENTED
- Manual check-in/check-out via web/mobile
- Default provider for the system
- No device dependency
- Location: `./manual/manual-attendance.provider.ts`

## Future Providers (Ready for Implementation)

### 2. BiometricAttendanceProvider 🔮
```
Purpose: Fingerprint/thumb impression devices
Vendors: ZKTeco, eSSL, Matrix, Suprema, BioMax, Mantra
Features:
  - Real-time device sync
  - Scheduled sync
  - TCP/HTTP/MQTT connectivity
  - Duplicate detection
  - Offline storage support
Location: ./biometric/ (to be created)
```

### 3. FaceRecognitionProvider 🔮
```
Purpose: Face recognition attendance systems
Features:
  - AI-based face matching
  - Liveness detection
  - Mask detection
  - Temperature screening integration
Location: ./face-recognition/ (to be created)
```

### 4. RFIDProvider 🔮
```
Purpose: RFID card-based attendance
Features:
  - Card reader integration
  - Card registration
  - Card deactivation
  - Multi-reader support
Location: ./rfid/ (to be created)
```

### 5. QRCodeProvider 🔮
```
Purpose: QR code-based attendance
Features:
  - Dynamic QR generation
  - Time-limited QR codes
  - QR scanner app integration
  - Prevent screenshot fraud
Location: ./qrcode/ (to be created)
```

### 6. GPSAttendanceProvider 🔮
```
Purpose: Mobile GPS-based attendance
Features:
  - Location verification
  - Geofencing
  - Distance calculation
  - Map integration
Location: ./gps/ (to be created)
```

### 7. APIAttendanceProvider 🔮
```
Purpose: Third-party API integration
Features:
  - REST API polling
  - Webhook receiver
  - OAuth authentication
  - Rate limiting
Location: ./api/ (to be created)
```

### 8. WebhookAttendanceProvider 🔮
```
Purpose: Webhook-based data push
Features:
  - Secure webhook endpoints
  - Signature verification
  - Retry mechanism
  - Event streaming
Location: ./webhook/ (to be created)
```

## How to Add a New Provider

### Step 1: Create Provider Class
```typescript
@Injectable()
export class YourProvider implements IAttendanceProvider {
  constructor(private readonly registry: AttendanceProviderRegistry) {}

  async onModuleInit() {
    this.registry.registerProvider(this, metadata);
  }

  getName(): string { return 'YOUR_PROVIDER'; }
  getSource(): AttendanceSource { return AttendanceSource.YOUR_SOURCE; }
  
  // Implement all interface methods...
}
```

### Step 2: Register in Module
```typescript
// attendance.module.ts
providers: [
  ManualAttendanceProvider,
  YourProvider, // Add here
]
```

### Step 3: Configure Provider
```typescript
// Set as active provider
await providerRegistry.setActiveProvider('YOUR_PROVIDER');
```

### Step 4: Test
```typescript
// The AttendanceService automatically uses the active provider
// No code changes needed in business logic!
```

## Provider Interface Contract

All providers MUST implement:

```typescript
interface IAttendanceProvider {
  getName(): string;
  getSource(): AttendanceSource;
  isActive(): Promise<boolean>;
  initialize(config: IProviderConfiguration): Promise<void>;
  recordAttendance(event: Partial<IAttendanceEvent>): Promise<IAttendanceEvent>;
  validateEvent(event: Partial<IAttendanceEvent>): Promise<boolean>;
  syncAttendance?(startDate: Date, endDate: Date): Promise<IAttendanceEvent[]>;
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
  getConfiguration(): IProviderConfiguration;
  updateConfiguration(config: Partial<IProviderConfiguration>): Promise<void>;
}
```

## Benefits of This Architecture

1. ✅ **Open/Closed Principle**: Open for extension, closed for modification
2. ✅ **Single Responsibility**: Each provider handles one attendance source
3. ✅ **Dependency Inversion**: Business logic depends on abstraction, not concrete classes
4. ✅ **Testability**: Easy to mock providers for testing
5. ✅ **Scalability**: Add unlimited providers without touching core code
6. ✅ **Maintainability**: Provider bugs don't affect other providers
7. ✅ **Flexibility**: Switch providers at runtime without deployment

## Provider Selection

Only ONE provider is active at a time per company/location.

Selection methods:
- Global setting (company-wide)
- Location-based (different providers per office)
- Department-based (different providers per department)
- Time-based (switch providers based on schedule)

## Testing Strategy

Each provider should have:
1. Unit tests for validation logic
2. Integration tests for device communication (if applicable)
3. Mock tests for business logic integration
4. Health check monitoring

## Security Considerations

- Validate all input from external sources
- Encrypt device communication
- Log all attendance events for audit
- Implement rate limiting for API providers
- Verify webhook signatures
- Use IP whitelisting for device connections

## Performance Optimization

- Cache provider instances
- Async event processing
- Batch sync for device providers
- Queue system for high volume
- Database connection pooling
- Redis caching for real-time data

## Monitoring & Alerting

Track:
- Provider health status
- Sync success/failure rates
- Device connectivity
- Attendance event latency
- Duplicate detection rate
- Data quality metrics
