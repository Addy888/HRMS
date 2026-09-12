const { PrismaClient } = require('@prisma/client');
const { AttendanceStatus, AttendanceSource } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Re-process matched raw attendance records to create Attendance table entries
 * This fixes the issue where Import History shows "Success" but Attendance table is empty
 */

async function reprocessMatchedRecords() {
  console.log('🔄 RE-PROCESSING MATCHED RAW ATTENDANCE RECORDS\n');
  
  // Get all matched raw records
  const matched = await prisma.rawAttendanceRecord.findMany({
    where: { isMatched: true },
    select: {
      id: true,
      employeeId: true,
      originalName: true,
      rawData: true,
      attendanceMonth: true,
      attendanceYear: true,
      importHistoryId: true
    }
  });
  
  console.log(`✅ Found ${matched.length} matched raw records to process\n`);
  
  for (const raw of matched) {
    console.log(`\n📋 Processing: ${raw.originalName}`);
    console.log(`   Employee UUID: ${raw.employeeId}`);
    console.log(`   Period: ${raw.attendanceYear}-${String(raw.attendanceMonth).padStart(2, '0')}`);
    
    const data = JSON.parse(raw.rawData);
    const columns = Object.keys(data);
    
    // Get employee and organization
    const employee = await prisma.employee.findUnique({
      where: { id: raw.employeeId },
      select: { organizationId: true }
    });
    
    if (!employee) {
      console.log(`   ❌ Employee not found, skipping`);
      continue;
    }
    
    const organizationId = employee.organizationId;
    
    // Find day columns
    const dayColumnPattern1 = /^(\d{2})\s+\w{3}$/; // "01 Sat"
    const dayColumnPattern2 = /^(\d+)$/; // "1", "2"
    
    const dayColumns = columns.filter(col => {
      return dayColumnPattern1.test(col) || dayColumnPattern2.test(col);
    });
    
    console.log(`   Found ${dayColumns.length} day columns`);
    
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    
    // Default shift times
    const defaultShiftHour = 10;
    const defaultShiftMinute = 0;
    
    for (const dayCol of dayColumns) {
      // Extract day number
      let dayNum;
      const match1 = dayCol.match(dayColumnPattern1);
      const match2 = dayCol.match(dayColumnPattern2);
      
      if (match1) {
        dayNum = parseInt(match1[1]);
      } else if (match2) {
        dayNum = parseInt(match2[1]);
      } else {
        continue;
      }
      
      if (dayNum < 1 || dayNum > 31) continue;
      
      const cellValue = data[dayCol];
      if (!cellValue || cellValue === '') {
        recordsSkipped++;
        continue;
      }
      
      const valueStr = cellValue.toString().trim().toUpperCase();
      if (!valueStr) {
        recordsSkipped++;
        continue;
      }
      
      // Map status code to attendance status
      let attendanceStatus;
      let checkInTime = null;
      let checkOutTime = null;
      let workingHours = 0;
      let lateBy = 0;
      
      switch (valueStr) {
        case 'P':
          attendanceStatus = 'PRESENT';
          checkInTime = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, dayNum, defaultShiftHour, defaultShiftMinute, 0));
          checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
          workingHours = 9;
          break;
        case 'A':
          attendanceStatus = 'ABSENT';
          break;
        case 'H':
        case 'HD':
          attendanceStatus = 'HALF_DAY';
          checkInTime = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, dayNum, defaultShiftHour, defaultShiftMinute, 0));
          checkOutTime = new Date(checkInTime.getTime() + 5 * 60 * 60 * 1000);
          workingHours = 5;
          break;
        case 'WO':
        case 'W':
        case 'WEEK OFF':
          attendanceStatus = 'WEEK_OFF';
          break;
        case 'L':
          attendanceStatus = 'LATE';
          checkInTime = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, dayNum, defaultShiftHour + 1, 0, 0));
          checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
          workingHours = 9;
          lateBy = 60;
          break;
        case 'LV':
        case 'LEAVE':
          attendanceStatus = 'LEAVE';
          break;
        case 'HOL':
        case 'HOLIDAY':
          attendanceStatus = 'HOLIDAY';
          break;
        default:
          recordsSkipped++;
          continue;
      }
      
      // Create attendance date
      const attendanceDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, dayNum, 0, 0, 0, 0));
      
      // Check if record exists
      try {
        const existing = await prisma.attendance.findUnique({
          where: {
            organizationId_employeeId_date: {
              organizationId,
              employeeId: raw.employeeId,
              date: attendanceDate
            }
          }
        });
        
        const attendanceData = {
          organizationId,
          employeeId: raw.employeeId,
          date: attendanceDate,
          checkInTime,
          checkOutTime,
          workingHours,
          status: attendanceStatus,
          lateBy,
          source: 'MANUAL',
          isManualEntry: true,
          approvedBy: 'system',
          approvedAt: new Date(),
          remarks: `Re-processed from import`
        };
        
        if (existing && existing.source !== 'MANUAL') {
          // Update only if not manually entered
          await prisma.attendance.update({
            where: { id: existing.id },
            data: attendanceData
          });
          recordsUpdated++;
        } else if (!existing) {
          // Create new
          await prisma.attendance.create({
            data: attendanceData
          });
          recordsCreated++;
        } else {
          recordsSkipped++;
        }
      } catch (error) {
        console.log(`     Error on day ${dayNum}: ${error.message}`);
        recordsSkipped++;
      }
    }
    
    console.log(`   ✅ Results: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsSkipped} skipped`);
  }
  
  console.log('\n✅ RE-PROCESSING COMPLETE');
  
  await prisma.$disconnect();
}

reprocessMatchedRecords().catch(console.error);
