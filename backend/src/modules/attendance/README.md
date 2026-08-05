# Attendance Management Module

## 🎯 Overview

Enterprise-grade attendance management system with **provider-based architecture** for FCS HRMS. Designed to support multiple attendance sources without modifying business logic.

## 🏗️ Architecture

### Core Design Principles

1. **Provider Pattern**: Attendance sources implemented as interchangeable providers
2. **Open/Closed Principle**: Open for extension, closed for modification
3. **Dependency Inversion**: Business logic depends on IAttendanceProvider interface
4. **Single Responsibility**: Each provider handles one attendance source
5. **Strategy Pattern**: Runtime provider selection

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Employee   │  │      HR      │  │   Mobile     │      │
│  │   Web App    │  │   Dashboard  │  │     App      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AttendanceController (REST APIs)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          AttendanceService (Business Logic)           │  │
│  │   - Check-in/Check-out                               │  │
│  │   - Attendance calculation                           │  │
│  │   - Status determination                             │  │
│  │   - Reporting                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROVIDER ABSTRACTION                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      AttendanceProviderRegistry (Factory)             │  │
│  │   Selects active provider at runtime                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         IAttendanceProvider (Interface)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│    Manual      │  │   Biometric    │  │   Face Recog   │
│   Provider     │  │   Provider     │  │   Provider     │
│   ✅ Active    │  │   🔮 Future    │  │   🔮 Future    │
└────────────────┘  └────────────────┘  └────────────────┘

          ▼                 ▼                 ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│   RFID         │  │   QR Code      │  │   GPS          │
│   Provider     │  │   Provider     │  │   Provider     │
│   🔮 Future    │  │   🔮 Future    │  │   🔮 Future    │
└────────────────┘  └────────────────┘  └────────────────┘

          ▼                 ▼
┌────────────────┐  ┌────────────────┐
│   API          │  │   Webhook      │
│   Provider     │  │   Provider     │
│   🔮 Future    │  │   🔮 Future    │
└────────────────┘  └────────────────┘
```

## 📁 Module Structure

```
attendance/
├── providers/                      # Provider implementations
│   ├── base/
│   │   └── attendance.provider.interface.ts   # Provider contract
│   ├── manual/
│   │   └── manual-attendance.provider.ts      # Manual entry (ACTIVE)
│   ├── biometric/                  # 🔮 Future: Fingerprint devices
│   ├── face-recognition/           # 🔮 Future: Face recognition
│   ├── rfid/                       # 🔮 Future: RFID cards
│   ├── qrcode/                     # 🔮 Future: QR code scanning
│   ├── gps/                        # 🔮 Future: GPS-based mobile
│   ├── api/                        # 🔮 Future: Third-party API
│   ├── webhook/                    # 🔮 Future: Webhook integration
│   └── provider.registry.ts        # Provider factory
├── services/
│   ├── attendance.service.ts       # Core business logic
│   ├── shift.service.ts            # Shift management
│   ├── holiday.service.ts          # Holiday management
│   ├── correction.service.ts       # Attendance corrections
│   ├── device.service.ts           # Device management
│   ├── sync.service.ts             # Data sync engine
│   └── calculation.service.ts      # Working hours calculation
├── controllers/
│   ├── attendance.controller.ts    # Employee attendance APIs
│   ├── shift.controller.ts         # Shift management APIs
│   ├── holiday.controller.ts       # Holiday management APIs
│   ├── device.controller.ts        # Device management APIs
│   └── report.controller.ts        # Attendance reports
├── dto/                            # Data Transfer Objects
│   ├── check-in.dto.ts
│   ├── attendance-query.dto.ts
│   ├── attendance-correction.dto.ts
│   ├── shift.dto.ts
│   └── holiday.dto.ts
├── enums/                          # Enums
│   ├── attendance-status.enum.ts
│   ├── attendance-source.enum.ts
│   ├── event-type.enum.ts
│   ├── provider-type.enum.ts
│   └── device-status.enum.ts
├── interfaces/
│   └── attendance-event.interface.ts
├── events/                         # Event emitters (future)
│   ├── attendance-checked-in.event.ts
│   └── attendance-checked-out.event.ts
└── attendance.module.ts            # Module definition
```

## 🚀 Features

### ✅ Implemented (Phase 10)

#### Employee Features
- ✅ Check-in/Check-out via web
- ✅ View attendance history
- ✅ View monthly attendance calendar
- ✅ View working hours
- ✅ View late entries
- ✅ Today's attendance status

#### HR Features
- ✅ View all employee attendance
- ✅ View daily attendance summary
- ✅ View employee attendance history
- ✅ Shift management (CRUD)
- ✅ Assign shifts to employees
- ✅ Holiday management
- ✅ Week-off configuration

#### System Features
- ✅ Provider-based architecture
- ✅ Manual attendance provider
- ✅ Automatic status calculation (Present/Late/Half-Day/Absent)
- ✅ Working hours calculation
- ✅ Overtime calculation
- ✅ Grace time handling
- ✅ Late marking rules
- ✅ Half-day rules
- ✅ Holiday detection
- ✅ Week-off detection
- ✅ Shift support (General/Morning/Evening/Night/Flexible)
- ✅ Attendance logging (audit trail)
- ✅ Location tracking (GPS coordinates)
- ✅ IP address tracking
- ✅ Device tracking

### 🔮 Future Enhancements

#### Additional Providers
- ⏳ BiometricAttendanceProvider (ZKTeco, eSSL, Matrix, etc.)
- ⏳ FaceRecognitionProvider (AI face matching)
- ⏳ RFIDProvider (RFID card readers)
- ⏳ QRCodeProvider (Dynamic QR codes)
- ⏳ GPSAttendanceProvider (Mobile GPS + Geofencing)
- ⏳ APIAttendanceProvider (Third-party integrations)
- ⏳ WebhookAttendanceProvider (Real-time data push)

#### HR Features
- ⏳ Edit attendance (manual correction)
- ⏳ Approve/reject attendance corrections
- ⏳ Bulk attendance import (CSV/Excel)
- ⏳ Mark Present/Absent manually
- ⏳ Mark Half Day
- ⏳ Mark Work From Home
- ⏳ Mark On Duty

#### Reports & Analytics
- ⏳ Daily attendance report
- ⏳ Monthly attendance report
- ⏳ Department-wise report
- ⏳ Late comers report
- ⏳ Early leavers report
- ⏳ Absentee report
- ⏳ Overtime report
- ⏳ Attendance trends
- ⏳ Export to Excel/PDF

#### Device Management
- ⏳ Device registration
- ⏳ Device health monitoring
- ⏳ Real-time sync status
- ⏳ Manual sync trigger
- ⏳ Device logs
- ⏳ Connection status

#### Advanced Features
- ⏳ Attendance correction workflow
- ⏳ Email notifications
- ⏳ SMS notifications
- ⏳ Push notifications
- ⏳ Biometric device integration
- ⏳ Face recognition integration
- ⏳ Mobile app attendance
- ⏳ Geofencing for mobile attendance
- ⏳ Attendance regularization
- ⏳ Missed punch alerts
- ⏳ Auto-absent marking
- ⏳ Rotational shifts
- ⏳ Shift swapping
- ⏳ Multiple punch support
- ⏳ Break time tracking

## 🔌 API Endpoints

### Employee Endpoints

```
POST   /attendance/check-in          # Check-in attendance
POST   /attendance/check-out         # Check-out attendance
GET    /attendance/my                # My attendance history
GET    /attendance/my/monthly        # My monthly attendance
GET    /attendance/my/today          # Today's status
```

### HR Endpoints

```
GET    /attendance                        # All attendance records
GET    /attendance/employee/:id           # Employee attendance
GET    /attendance/employee/:id/monthly   # Employee monthly attendance
POST   /attendance/manual                 # Manual attendance entry
PATCH  /attendance/:id                    # Edit attendance
POST   /attendance/corrections            # Request correction
PATCH  /attendance/corrections/:id        # Approve/reject correction
```

### Shift Management

```
POST   /shifts                # Create shift
GET    /shifts                # List all shifts
GET    /shifts/:id            # Get shift details
PATCH  /shifts/:id            # Update shift
DELETE /shifts/:id            # Delete shift
POST   /shifts/assign         # Assign shift to employee
GET    /shifts/employee/:id   # Employee shift history
```

### Holiday Management

```
POST   /holidays              # Create holiday
GET    /holidays              # List holidays
PATCH  /holidays/:id          # Update holiday
DELETE /holidays/:id          # Delete holiday
POST   /week-offs             # Configure week-off
```

## 💾 Database Schema

### Core Tables

- **Shift**: Shift definitions (timings, rules, grace time)
- **ShiftAssignment**: Employee shift assignments
- **Attendance**: Daily attendance records
- **AttendanceLog**: Detailed event logs (check-in/out)
- **AttendanceCorrection**: Correction requests
- **AttendanceHistory**: Audit trail of changes
- **AttendanceProvider**: Provider configuration
- **AttendanceDevice**: Device registry
- **AttendanceSyncLog**: Sync operation logs
- **Holiday**: Holiday calendar
- **WeekOff**: Week-off configuration
- **AttendanceSummary**: Monthly summaries (for performance)

## 🎨 Provider Pattern - How It Works

### 1. Define Provider Interface

```typescript
interface IAttendanceProvider {
  getName(): string;
  getSource(): AttendanceSource;
  recordAttendance(event: IAttendanceEvent): Promise<IAttendanceEvent>;
  validateEvent(event: IAttendanceEvent): Promise<boolean>;
  healthCheck(): Promise<{ healthy: boolean }>;
  // ... other methods
}
```

### 2. Implement Provider

```typescript
@Injectable()
export class ManualAttendanceProvider implements IAttendanceProvider {
  constructor(private registry: AttendanceProviderRegistry) {}

  async onModuleInit() {
    // Auto-register on startup
    this.registry.registerProvider(this, metadata);
  }

  async recordAttendance(event: IAttendanceEvent) {
    // Provider-specific logic
    return processedEvent;
  }
}
```

### 3. Use in Service (Business Logic)

```typescript
@Injectable()
export class AttendanceService {
  constructor(private providerRegistry: AttendanceProviderRegistry) {}

  async checkIn(employeeId: string, dto: CheckInDto) {
    // Get active provider (could be Manual, Biometric, RFID, etc.)
    const provider = await this.providerRegistry.getActiveProvider();
    
    // Record using provider - service doesn't know which one!
    const event = await provider.recordAttendance({
      employeeId,
      eventType: 'CHECK_IN',
      timestamp: new Date(),
    });
    
    // Save to database
    return this.saveAttendance(event);
  }
}
```

### 4. Switch Providers at Runtime

```typescript
// Change from Manual to Biometric
await providerRegistry.setActiveProvider('BIOMETRIC');

// Now all attendance goes through biometric provider
// NO CODE CHANGES NEEDED IN AttendanceService!
```

## 🔐 Security

- ✅ JWT authentication required
- ✅ Role-based access control (Employee/HR)
- ✅ Employees can only mark their own attendance
- ✅ HR can view/edit all attendance
- ✅ IP address logging
- ✅ Device type logging
- ✅ Location tracking
- ✅ Audit trail (AttendanceLog + AttendanceHistory)
- ⏳ Geofencing (future)
- ⏳ Device whitelist (future)
- ⏳ Biometric verification (future)

## 📊 Attendance Calculation Logic

### Status Determination

```typescript
if (holiday) status = 'HOLIDAY';
else if (weekOff) status = 'WEEK_OFF';
else if (onLeave) status = 'LEAVE';
else if (!checkIn) status = 'ABSENT';
else if (lateBy >= halfDayThreshold) status = 'HALF_DAY';
else if (lateBy >= lateThreshold) status = 'LATE';
else status = 'PRESENT';
```

### Working Hours

```typescript
totalMinutes = checkOutTime - checkInTime;
workingHours = (totalMinutes / 60) - (breakTime / 60);
overtime = max(0, workingHours - minimumWorkingHours);
```

### Late Calculation

```typescript
if (checkInTime > (shiftStartTime + graceTime)) {
  lateBy = checkInTime - (shiftStartTime + graceTime);
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Deployment

### Environment Variables

```env
DATABASE_URL="mysql://user:password@localhost:3306/fcs_hrms"
JWT_SECRET="your-secret-key"
```

### Running Migrations

```bash
# Create migration
npx prisma migrate dev --name attendance_module

# Deploy to production
npx prisma migrate deploy
```

## 📝 Adding a New Provider

### Step 1: Create Provider Class

```bash
mkdir src/modules/attendance/providers/biometric
touch src/modules/attendance/providers/biometric/biometric-attendance.provider.ts
```

### Step 2: Implement Interface

```typescript
@Injectable()
export class BiometricAttendanceProvider implements IAttendanceProvider {
  constructor(private registry: AttendanceProviderRegistry) {}

  async onModuleInit() {
    this.registry.registerProvider(this, {
      name: 'BIOMETRIC',
      displayName: 'Biometric Attendance',
      // ... metadata
    });
  }

  // Implement all interface methods
}
```

### Step 3: Register in Module

```typescript
// attendance.module.ts
providers: [
  ManualAttendanceProvider,
  BiometricAttendanceProvider, // Add here
]
```

### Step 4: Activate Provider

```typescript
// Set as active
await providerRegistry.setActiveProvider('BIOMETRIC');
```

**That's it!** No changes needed to:
- AttendanceService
- Controllers
- Business logic
- Database schema

## 🎯 Design Goals Achieved

✅ **Extensibility**: New providers without code changes  
✅ **Maintainability**: Provider bugs isolated  
✅ **Testability**: Easy to mock providers  
✅ **Scalability**: Handles thousands of employees  
✅ **Flexibility**: Runtime provider switching  
✅ **Reliability**: Comprehensive audit trail  
✅ **Performance**: Optimized queries + caching ready  
✅ **Security**: Authentication + authorization + logging  

## 📚 References

- [Provider Pattern](https://en.wikipedia.org/wiki/Provider_model)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Inversion](https://en.wikipedia.org/wiki/Dependency_inversion_principle)

## 🤝 Contributing

When adding new features:
1. Follow the provider pattern
2. Don't modify AttendanceService for provider-specific logic
3. Add provider-specific logic in provider implementations
4. Update documentation
5. Add tests
6. Follow TypeScript/NestJS best practices

## 📄 License

Copyright © 2026 FCS HRMS. All rights reserved.
