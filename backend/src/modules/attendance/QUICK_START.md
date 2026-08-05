# 🚀 Attendance Module - Quick Start Guide

## Getting Started in 5 Minutes

### 1. Check Database

```bash
# Verify tables are created
npx prisma studio

# Should see these tables:
# - Shift (5 records)
# - Holiday (11 records)
# - AttendanceProvider (8 records)
# - ShiftAssignment (2 records)
# - Attendance (empty, will fill as employees check-in)
```

### 2. Test Employee Check-In

```bash
# Login as employee
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "employee@fcshrms.local",
  "password": "12345678"
}

# Copy the token from response

# Check-in
POST http://localhost:3000/attendance/check-in
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "ipAddress": "192.168.1.100",
  "deviceType": "Web Browser",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.209,
    "address": "Delhi, India"
  },
  "remarks": "Testing check-in"
}

# Expected Response:
{
  "success": true,
  "message": "Checked in successfully",
  "attendance": {
    "id": "...",
    "employeeId": "...",
    "date": "2026-08-05",
    "checkInTime": "2026-08-05T09:30:00Z",
    "status": "PRESENT",
    "lateBy": 15,
    "source": "MANUAL",
    ...
  }
}
```

### 3. View My Attendance

```bash
# Get today's status
GET http://localhost:3000/attendance/my/today
Authorization: Bearer <your-token>

# Get attendance history
GET http://localhost:3000/attendance/my?startDate=2026-08-01&endDate=2026-08-31
Authorization: Bearer <your-token>

# Get monthly calendar
GET http://localhost:3000/attendance/my/monthly?month=8&year=2026
Authorization: Bearer <your-token>
```

### 4. Test Employee Check-Out

```bash
# Check-out (after a few hours)
POST http://localhost:3000/attendance/check-out
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "ipAddress": "192.168.1.100",
  "remarks": "Completed work for the day"
}

# Expected Response:
{
  "success": true,
  "message": "Checked out successfully",
  "attendance": {
    ...
    "checkOutTime": "2026-08-05T18:30:00Z",
    "workingHours": 8.5,
    "overtime": 0.5,
    ...
  }
}
```

### 5. Test HR Functions

```bash
# Login as HR
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "adityashastri76@gmail.com",
  "password": "12345678"
}

# View all shifts
GET http://localhost:3000/shifts
Authorization: Bearer <hr-token>

# View employee attendance
GET http://localhost:3000/attendance/employee/<employee-id>
Authorization: Bearer <hr-token>

# View all holidays
GET http://localhost:3000/holidays
Authorization: Bearer <hr-token>
```

## 🎨 Understanding the Provider Pattern

### Current Setup

```typescript
// The system uses Manual Provider by default
// Located at: providers/manual/manual-attendance.provider.ts

// When employee checks in:
Employee → Controller → AttendanceService → ProviderRegistry → ManualProvider
                                                                    ↓
                                                            recordAttendance()
                                                                    ↓
                                                              Save to DB
```

### How Business Logic Works

```typescript
// AttendanceService (business logic)
async checkIn(employeeId: string, dto: CheckInDto) {
  // Step 1: Get active provider (doesn't know if it's Manual, Biometric, etc.)
  const provider = await this.providerRegistry.getActiveProvider();
  
  // Step 2: Record using provider
  const event = await provider.recordAttendance({
    employeeId,
    eventType: 'CHECK_IN',
    timestamp: new Date(),
  });
  
  // Step 3: Calculate status, hours, etc.
  const attendance = await this.calculateAttendance(event);
  
  // Step 4: Save to database
  return await this.saveAttendance(attendance);
}
```

### The Magic: Adding New Provider

```typescript
// Example: Add Biometric Provider

// Step 1: Create provider (implements IAttendanceProvider)
@Injectable()
export class BiometricAttendanceProvider implements IAttendanceProvider {
  constructor(private registry: AttendanceProviderRegistry) {}
  
  async onModuleInit() {
    this.registry.registerProvider(this, {
      name: 'BIOMETRIC',
      displayName: 'Biometric Attendance',
      // ...
    });
  }
  
  async recordAttendance(event) {
    // Connect to biometric device
    // Get fingerprint data
    // Validate
    // Return attendance event
  }
}

// Step 2: Register in module
// attendance.module.ts
providers: [
  ManualAttendanceProvider,
  BiometricAttendanceProvider, // Add here
]

// Step 3: Switch provider
await providerRegistry.setActiveProvider('BIOMETRIC');

// DONE! AttendanceService code unchanged!
```

## 📊 Attendance Status Logic

### Status Determination

```typescript
// Automatic status calculation:

if (holiday exists) → HOLIDAY
else if (week off) → WEEK_OFF
else if (on leave) → LEAVE
else if (no check-in) → ABSENT
else if (late >= 4 hours) → HALF_DAY
else if (late >= 15 mins) → LATE
else → PRESENT
```

### Working Hours Calculation

```typescript
// Check-in: 09:30 AM
// Check-out: 06:30 PM
// Break: 1 hour

totalTime = 06:30 PM - 09:30 AM = 9 hours
workingHours = 9 hours - 1 hour break = 8 hours
overtime = 8 hours - 8 hours (min) = 0 hours

// If checkout at 07:30 PM instead:
totalTime = 10 hours
workingHours = 9 hours
overtime = 1 hour ✅
```

### Late Calculation

```typescript
// Shift: 09:00 AM
// Grace: 15 minutes
// Check-in: 09:20 AM

lateBy = 09:20 - (09:00 + 15 mins) = 5 minutes

if (lateBy >= 240 mins) → HALF_DAY
else if (lateBy >= 15 mins) → LATE
else → PRESENT (within grace)
```

## 🔄 Common Workflows

### Workflow 1: Normal Day

```
1. Employee arrives → Check-in (09:05 AM)
2. System: Shift is 09:00, grace 15 mins, check-in within grace
3. Status: PRESENT ✅
4. Employee leaves → Check-out (06:10 PM)
5. System: Calculate working hours = 8.08 hours
6. Status: PRESENT, 8.08 hours worked ✅
```

### Workflow 2: Late Arrival

```
1. Employee arrives late → Check-in (09:45 AM)
2. System: Late by 30 minutes (after grace)
3. Status: LATE ⚠️
4. Employee leaves → Check-out (06:45 PM)
5. System: Working hours = 8 hours (compensated for late)
6. Status: LATE, 8 hours worked
```

### Workflow 3: Half Day

```
1. Employee arrives very late → Check-in (01:00 PM)
2. System: Late by 4 hours (240 minutes)
3. Status: HALF_DAY ⚠️
4. Employee leaves → Check-out (06:00 PM)
5. System: Working hours = 4 hours
6. Status: HALF_DAY, 4 hours worked
```

### Workflow 4: Holiday

```
1. August 15 (Independence Day)
2. System: Checks holiday table
3. Status: HOLIDAY 🎉
4. No attendance required
```

### Workflow 5: Week Off

```
1. Sunday
2. System: Checks week-off configuration
3. Status: WEEK_OFF 🏖️
4. No attendance required
```

## 🛠️ Useful Commands

```bash
# View database
npx prisma studio

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Run seed again
npx tsx prisma/seed.ts

# Generate Prisma client
npx prisma generate

# Build
npm run build

# Start dev server
npm run start:dev

# Start production server
npm run start:prod

# Run tests (when implemented)
npm run test
```

## 📝 Code Examples

### Example 1: Get Employee's Current Shift

```typescript
// shift.service.ts
const shift = await this.shiftService.getEmployeeCurrentShift(employeeId);

// Returns:
{
  id: '...',
  name: 'General Shift',
  startTime: '09:00',
  endTime: '18:00',
  graceTime: 15,
  ...
}
```

### Example 2: Check if Today is Holiday

```typescript
const today = new Date();
const holiday = await prisma.holiday.findFirst({
  where: {
    date: today,
    OR: [
      { departmentId: null }, // Company-wide
      { departmentId: employee.departmentId },
    ],
  },
});

if (holiday) {
  console.log(`Today is ${holiday.name}`);
}
```

### Example 3: Get Monthly Summary

```typescript
const summary = await attendanceService.getMonthlyAttendance(
  employeeId,
  { month: 8, year: 2026 }
);

// Returns:
{
  totalPresent: 22,
  totalAbsent: 0,
  totalLate: 3,
  totalWorkingHours: 176.5,
  attendancePercentage: 100,
  ...
}
```

## 🎯 Testing Checklist

- [ ] Employee can check-in
- [ ] Employee can check-out
- [ ] Late detection works
- [ ] Half-day detection works
- [ ] Holiday detection works
- [ ] Week-off detection works
- [ ] Working hours calculated correctly
- [ ] Overtime calculated correctly
- [ ] Monthly summary accurate
- [ ] HR can view all attendance
- [ ] HR can view employee attendance
- [ ] Shift assignment works

## 🐛 Troubleshooting

### Issue: "Cannot find module"

```bash
# Solution: Rebuild
npm run build
```

### Issue: "Provider not found"

```typescript
// Check if provider is registered
const providers = providerRegistry.getAllProviders();
console.log(providers); // Should include 'MANUAL'
```

### Issue: "Already checked in"

```typescript
// Check existing attendance
const today = startOfDay(new Date());
const existing = await prisma.attendance.findFirst({
  where: { employeeId, date: today }
});

if (existing && existing.checkInTime) {
  // Already checked in
}
```

### Issue: "Shift not found"

```bash
# Run seed again
npx tsx prisma/seed.ts
```

## 📚 Further Reading

- **Full Documentation**: `README.md`
- **Provider Guide**: `providers/README.md`
- **Phase Summary**: `../../../PHASE_10_SUMMARY.md`
- **API Reference**: Swagger UI at `http://localhost:3000/api`

## 🎓 Next Steps

1. ✅ Understand the provider pattern
2. ✅ Test all employee endpoints
3. ✅ Test all HR endpoints
4. ⏳ Implement frontend components
5. ⏳ Add biometric provider
6. ⏳ Add mobile app support

---

**Need Help?**
- Check `README.md` for detailed documentation
- Review code comments in service files
- Test with Postman/Insomnia
- Check Prisma Studio for database state

---

**Quick Start Complete!** 🎉

You're now ready to:
- ✅ Use the attendance system
- ✅ Understand the architecture
- ✅ Add new features
- ✅ Debug issues

Happy coding! 🚀
