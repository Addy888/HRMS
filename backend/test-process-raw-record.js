const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Process the test raw attendance record to create Attendance table entries
 * This simulates what importFlexibleAttendanceRow() does
 */

async function processTestRecord() {
  console.log('🔄 PROCESSING TEST RAW ATTENDANCE RECORD\n');
  
  // Get the test raw record we just created
  const rawRecord = await prisma.rawAttendanceRecord.findFirst({
    where: {
      originalName: 'Sumaiyya Tamboli',
      isMatched: true,
      attendanceMonth: 9,
      attendanceYear: 2026
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      employeeId: true,
      originalName: true,
      rawData: true,
      attendanceMonth: true,
      attendanceYear: true,
      organizationId: true,
      importHistoryId: true
    }
  });
  
  if (!rawRecord) {
    console.log('❌ Test raw record not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`✅ Found raw record: ${rawRecord.id}`);
  console.log(`   Employee UUID: ${rawRecord.employeeId}`);
  console.log(`   Period: ${rawRecord.attendanceYear}-${String(rawRecord.attendanceMonth).padStart(2, '0')}\n`);
  
  const data = JSON.parse(rawRecord.rawData);
  const allColumns = Object.keys(data);
  
  // Get user for approvedBy
  const user = await prisma.user.findFirst({
    where: { organizationId: rawRecord.organizationId },
    select: { id: true }
  });
  
  // Find day columns
  const dayColumnPattern1 = /^(\d{2})\s+\w{3}$/; // "01 Sat"
  const dayColumns = allColumns.filter(col => dayColumnPattern1.test(col));
  
  console.log(`📅 Found ${dayColumns.length} day columns\n`);
  console.log('Processing each day...\n');
  
  let recordsCreated = 0;
  let recordsSkipped = 0;
  
  const defaultShiftHour = 10;
  const defaultShiftMinute = 0;
  
  for (const dayCol of dayColumns) {
    const match = dayCol.match(dayColumnPattern1);
    const dayNum = parseInt(match[1]);
    
    if (dayNum < 1 || dayNum > 31) continue;
    
    const cellValue = data[dayCol];
    if (!cellValue || cellValue === '') {
      recordsSkipped++;
      continue;
    }
    
    const statusCode = cellValue.toString().trim().toUpperCase();
    
    let attendanceStatus;
    let checkInTime = null;
    let checkOutTime = null;
    let workingHours = 0;
    let lateBy = 0;
    
    switch (statusCode) {
      case 'P':
        attendanceStatus = 'PRESENT';
        checkInTime = new Date(Date.UTC(rawRecord.attendanceYear, rawRecord.attendanceMonth - 1, dayNum, defaultShiftHour, defaultShiftMinute, 0));
        checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
        workingHours = 9;
        break;
      case 'A':
        attendanceStatus = 'ABSENT';
        break;
      case 'H':
      case 'HD':
        attendanceStatus = 'HALF_DAY';
        checkInTime = new Date(Date.UTC(rawRecord.attendanceYear, rawRecord.attendanceMonth - 1, dayNum, defaultShiftHour, defaultShiftMinute, 0));
        checkOutTime = new Date(checkInTime.getTime() + 5 * 60 * 60 * 1000);
        workingHours = 5;
        break;
      case 'WO':
      case 'W':
        attendanceStatus = 'WEEK_OFF';
        break;
      case 'L':
        attendanceStatus = 'LATE';
        checkInTime = new Date(Date.UTC(rawRecord.attendanceYear, rawRecord.attendanceMonth - 1, dayNum, defaultShiftHour + 1, 0, 0));
        checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
        workingHours = 9;
        lateBy = 60;
        break;
      default:
        recordsSkipped++;
        continue;
    }
    
    const attendanceDate = new Date(Date.UTC(rawRecord.attendanceYear, rawRecord.attendanceMonth - 1, dayNum, 0, 0, 0, 0));
    
    try {
      const existing = await prisma.attendance.findUnique({
        where: {
          organizationId_employeeId_date: {
            organizationId: rawRecord.organizationId,
            employeeId: rawRecord.employeeId,
            date: attendanceDate
          }
        }
      });
      
      const attendanceData = {
        organizationId: rawRecord.organizationId,
        employeeId: rawRecord.employeeId,
        date: attendanceDate,
        checkInTime,
        checkOutTime,
        workingHours,
        status: attendanceStatus,
        lateBy,
        source: 'MANUAL',
        isManualEntry: true,
        approvedBy: user.id,
        approvedAt: new Date(),
        remarks: `Test import for Sumaiyya Tamboli - September 2026`
      };
      
      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: attendanceData
        });
        console.log(`  Day ${String(dayNum).padStart(2, '0')} (${dayCol}): ${statusCode.padEnd(6)} → UPDATED`);
      } else {
        await prisma.attendance.create({
          data: attendanceData
        });
        console.log(`  Day ${String(dayNum).padStart(2, '0')} (${dayCol}): ${statusCode.padEnd(6)} → CREATED`);
        recordsCreated++;
      }
    } catch (error) {
      console.log(`  Day ${String(dayNum).padStart(2, '0')}: ERROR - ${error.message}`);
      recordsSkipped++;
    }
  }
  
  console.log(`\n✅ Processing complete:`);
  console.log(`   Created: ${recordsCreated}`);
  console.log(`   Skipped: ${recordsSkipped}`);
  console.log(`\n📊 NEXT: Verify attendance records in database`);
  console.log(`   Run: node verify-sumaiyya-attendance.js`);
  
  await prisma.$disconnect();
}

processTestRecord().catch(console.error);
