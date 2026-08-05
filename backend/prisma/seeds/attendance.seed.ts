/**
 * Attendance Module Seed Data
 * Seeds shifts, holidays, week-offs, and providers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAttendance() {
  console.log('🕒 Seeding attendance module...');

  // 1. Seed Shifts
  const shifts = [
    {
      name: 'General Shift',
      code: 'GEN',
      startTime: '09:00',
      endTime: '18:00',
      graceTime: 15,
      lateMarkAfter: 15,
      halfDayIfLateBy: 240,
      minimumWorkingHours: 8.0,
      maximumWorkingHours: 12.0,
      breakTime: 60,
      overtimeApplicable: true,
      flexibleShift: false,
      weekends: 'SATURDAY,SUNDAY',
      status: 'ACTIVE',
      description: 'Standard 9 AM to 6 PM office hours',
    },
    {
      name: 'Morning Shift',
      code: 'MOR',
      startTime: '06:00',
      endTime: '15:00',
      graceTime: 15,
      lateMarkAfter: 15,
      halfDayIfLateBy: 240,
      minimumWorkingHours: 8.0,
      maximumWorkingHours: 12.0,
      breakTime: 60,
      overtimeApplicable: true,
      flexibleShift: false,
      weekends: 'SATURDAY,SUNDAY',
      status: 'ACTIVE',
      description: 'Early morning shift for operations team',
    },
    {
      name: 'Evening Shift',
      code: 'EVE',
      startTime: '14:00',
      endTime: '23:00',
      graceTime: 15,
      lateMarkAfter: 15,
      halfDayIfLateBy: 240,
      minimumWorkingHours: 8.0,
      maximumWorkingHours: 12.0,
      breakTime: 60,
      overtimeApplicable: true,
      flexibleShift: false,
      weekends: 'SATURDAY,SUNDAY',
      status: 'ACTIVE',
      description: 'Evening shift for customer support',
    },
    {
      name: 'Night Shift',
      code: 'NIGHT',
      startTime: '22:00',
      endTime: '07:00',
      graceTime: 15,
      lateMarkAfter: 15,
      halfDayIfLateBy: 240,
      minimumWorkingHours: 8.0,
      maximumWorkingHours: 12.0,
      breakTime: 60,
      overtimeApplicable: true,
      flexibleShift: false,
      weekends: 'SATURDAY,SUNDAY',
      status: 'ACTIVE',
      description: 'Night shift for 24/7 operations',
    },
    {
      name: 'Flexible Shift',
      code: 'FLEX',
      startTime: '00:00',
      endTime: '23:59',
      graceTime: 0,
      lateMarkAfter: 0,
      halfDayIfLateBy: 480,
      minimumWorkingHours: 8.0,
      maximumWorkingHours: 12.0,
      breakTime: 60,
      overtimeApplicable: false,
      flexibleShift: true,
      weekends: 'SATURDAY,SUNDAY',
      status: 'ACTIVE',
      description: 'Flexible working hours - complete 8 hours anytime',
    },
  ];

  for (const shift of shifts) {
    await prisma.shift.upsert({
      where: { code: shift.code },
      update: shift,
      create: shift,
    });
  }

  console.log(`✔ Shifts seeded: ${shifts.length} shifts`);

  // 2. Seed National Holidays 2026
  const holidays = [
    {
      name: 'New Year',
      date: new Date('2026-01-01'),
      type: 'NATIONAL',
      description: 'New Year celebration',
      isOptional: false,
    },
    {
      name: 'Republic Day',
      date: new Date('2026-01-26'),
      type: 'NATIONAL',
      description: 'Indian Republic Day',
      isOptional: false,
    },
    {
      name: 'Holi',
      date: new Date('2026-03-14'),
      type: 'FESTIVAL',
      description: 'Festival of Colors',
      isOptional: false,
    },
    {
      name: 'Good Friday',
      date: new Date('2026-04-03'),
      type: 'FESTIVAL',
      description: 'Good Friday',
      isOptional: false,
    },
    {
      name: 'Eid ul-Fitr',
      date: new Date('2026-04-21'),
      type: 'FESTIVAL',
      description: 'End of Ramadan',
      isOptional: false,
    },
    {
      name: 'Independence Day',
      date: new Date('2026-08-15'),
      type: 'NATIONAL',
      description: 'Indian Independence Day',
      isOptional: false,
    },
    {
      name: 'Janmashtami',
      date: new Date('2026-08-31'),
      type: 'FESTIVAL',
      description: 'Birth of Lord Krishna',
      isOptional: true,
    },
    {
      name: 'Gandhi Jayanti',
      date: new Date('2026-10-02'),
      type: 'NATIONAL',
      description: 'Birthday of Mahatma Gandhi',
      isOptional: false,
    },
    {
      name: 'Dussehra',
      date: new Date('2026-10-12'),
      type: 'FESTIVAL',
      description: 'Victory of good over evil',
      isOptional: false,
    },
    {
      name: 'Diwali',
      date: new Date('2026-10-31'),
      type: 'FESTIVAL',
      description: 'Festival of Lights',
      isOptional: false,
    },
    {
      name: 'Christmas',
      date: new Date('2026-12-25'),
      type: 'NATIONAL',
      description: 'Birth of Jesus Christ',
      isOptional: false,
    },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: {
        name_date: {
          name: holiday.name,
          date: holiday.date,
        },
      },
      update: holiday,
      create: holiday,
    });
  }

  console.log(`✔ Holidays seeded: ${holidays.length} holidays`);

  // 3. Seed Week-Offs (Company-wide)
  const weekOffs = [
    {
      dayOfWeek: 'SUNDAY',
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null,
      isActive: true,
    },
  ];

  for (const weekOff of weekOffs) {
    await prisma.weekOff.create({
      data: weekOff,
    });
  }

  console.log(`✔ Week-offs seeded: ${weekOffs.length} week-offs`);

  // 4. Seed Attendance Providers
  const providers = [
    {
      name: 'MANUAL',
      displayName: 'Manual Attendance',
      type: 'MANUAL',
      isActive: true,
      isPrimary: true,
      description: 'Manual attendance entry via web and mobile application',
      configuration: JSON.stringify({
        allowFutureDate: false,
        maxPastDays: 30,
        requireLocation: false,
        requirePhoto: false,
      }),
    },
    {
      name: 'BIOMETRIC',
      displayName: 'Biometric Attendance',
      type: 'DEVICE',
      isActive: false,
      isPrimary: false,
      description: 'Fingerprint-based biometric attendance system (ZKTeco, eSSL, Matrix, etc.)',
      configuration: JSON.stringify({
        autoSync: true,
        syncInterval: 5,
        deviceProtocol: 'TCP',
        conflictResolution: 'DEVICE_PRIORITY',
      }),
    },
    {
      name: 'FACE_RECOGNITION',
      displayName: 'Face Recognition',
      type: 'DEVICE',
      isActive: false,
      isPrimary: false,
      description: 'AI-powered face recognition attendance system',
      configuration: JSON.stringify({
        livenessDetection: true,
        maskDetection: true,
        temperatureScreening: false,
        confidenceThreshold: 0.95,
      }),
    },
    {
      name: 'RFID',
      displayName: 'RFID Attendance',
      type: 'DEVICE',
      isActive: false,
      isPrimary: false,
      description: 'RFID card-based attendance system',
      configuration: JSON.stringify({
        cardFormat: 'MIFARE',
        allowUnregisteredCards: false,
        cardValidityCheck: true,
      }),
    },
    {
      name: 'QR_CODE',
      displayName: 'QR Code Attendance',
      type: 'SOFTWARE',
      isActive: false,
      isPrimary: false,
      description: 'Dynamic QR code-based attendance via mobile app',
      configuration: JSON.stringify({
        qrExpiry: 30,
        preventScreenshot: true,
        locationVerification: true,
      }),
    },
    {
      name: 'GPS',
      displayName: 'GPS Attendance',
      type: 'SOFTWARE',
      isActive: false,
      isPrimary: false,
      description: 'GPS and geofencing-based mobile attendance',
      configuration: JSON.stringify({
        geofenceRadius: 100,
        allowedLocations: [],
        accuracyThreshold: 50,
      }),
    },
    {
      name: 'API',
      displayName: 'API Integration',
      type: 'API',
      isActive: false,
      isPrimary: false,
      description: 'Third-party API integration for attendance data',
      configuration: JSON.stringify({
        authType: 'OAUTH2',
        syncMethod: 'PULL',
        syncInterval: 15,
      }),
    },
    {
      name: 'WEBHOOK',
      displayName: 'Webhook Integration',
      type: 'API',
      isActive: false,
      isPrimary: false,
      description: 'Real-time attendance data push via webhooks',
      configuration: JSON.stringify({
        signatureVerification: true,
        retryAttempts: 3,
        retryDelay: 5,
      }),
    },
  ];

  for (const provider of providers) {
    await prisma.attendanceProvider.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
  }

  console.log(`✔ Attendance providers seeded: ${providers.length} providers`);

  // 5. Assign General Shift to all existing employees
  const employees = await prisma.employee.findMany();
  const generalShift = await prisma.shift.findUnique({
    where: { code: 'GEN' },
  });

  if (generalShift && employees.length > 0) {
    for (const employee of employees) {
      // Check if already has shift
      const existing = await prisma.shiftAssignment.findFirst({
        where: {
          employeeId: employee.id,
          isActive: true,
        },
      });

      if (!existing) {
        await prisma.shiftAssignment.create({
          data: {
            employeeId: employee.id,
            shiftId: generalShift.id,
            effectiveFrom: new Date('2026-01-01'),
            isActive: true,
            assignedBy: 'SYSTEM',
            remarks: 'Default shift assignment',
          },
        });
      }
    }

    console.log(`✔ Default shifts assigned to ${employees.length} employees`);
  }

  console.log('✅ Attendance module seeding complete!\n');
}
