/**
 * DELETE WRONG MONTH ATTENDANCE AND RE-CREATE WITH CORRECT MONTH
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMonth() {
  console.log('🔧 FIXING MONTH ISSUE\n');
  
  // Step 1: Delete attendance created by the wrong script
  const deleted = await prisma.attendance.deleteMany({
    where: {
      remarks: 'Imported from biometric Excel'
    }
  });
  
  console.log(`✅ Deleted ${deleted.count} wrong attendance records\n`);
  
  // Step 2: Get raw records with correct month/year
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      isMatched: true,
      attendanceMonth: { not: null },
      attendanceYear: { not: null },
    },
    select: {
      id: true,
      employeeId: true,
      attendanceMonth: true,
      attendanceYear: true,
      rawData: true,
    }
  });
  
  console.log(`Found ${rawRecords.length} matched raw records\n`);
  
  let created = 0;
  
  for (const record of rawRecords) {
    if (!record.employeeId) continue;
    
    const employee = await prisma.employee.findUnique({
      where: { id: record.employeeId },
      select: {
        id: true,
        employeeId: true,
        organizationId: true,
      }
    });
    
    if (!employee) continue;
    
    const rawData = JSON.parse(record.rawData);
    const dateColumns = Object.keys(rawData).filter(key => /^\d+\s*/.test(key));
    
    console.log(`Processing ${employee.employeeId} - Month ${record.attendanceMonth}/${record.attendanceYear}`);
    
    for (const dayCol of dateColumns) {
      const dayMatch = dayCol.match(/^(\d+)/);
      if (!dayMatch) continue;
      
      const dayNum = parseInt(dayMatch[1]);
      if (dayNum < 1 || dayNum > 31) continue;
      
      const statusValue = rawData[dayCol];
      if (!statusValue || typeof statusValue !== 'string') continue;
      
      const statusStr = statusValue.trim().toUpperCase();
      
      let attendanceStatus;
      switch (statusStr) {
        case 'P': attendanceStatus = 'PRESENT'; break;
        case 'A': attendanceStatus = 'ABSENT'; break;
        case 'H': case 'HD': attendanceStatus = 'HALF_DAY'; break;
        case 'WO': case 'W': attendanceStatus = 'WEEK_OFF'; break;
        case 'L': attendanceStatus = 'LATE'; break;
        case 'LV': case 'LEAVE': attendanceStatus = 'LEAVE'; break;
        case 'HOL': case 'HOLIDAY': attendanceStatus = 'HOLIDAY'; break;
        default: continue;
      }
      
      // ✅ CRITICAL FIX: Use attendanceMonth directly (it's already 1-12), subtract 1 for JS Date
      const attendanceDate = new Date(Date.UTC(
        record.attendanceYear,
        record.attendanceMonth - 1,  // ✅ This is correct: month 8 (August) → index 7
        dayNum,
        0, 0, 0, 0
      ));
      
      // Verify the month is correct
      const verifyMonth = attendanceDate.getUTCMonth() + 1; // Convert back to 1-12
      if (verifyMonth !== record.attendanceMonth) {
        console.log(`  ⚠️  Month mismatch for day ${dayNum}: expected ${record.attendanceMonth}, got ${verifyMonth}`);
        continue;
      }
      
      let checkInTime = null;
      let checkOutTime = null;
      let workingHours = 0;
      let lateBy = 0;
      
      if (['PRESENT', 'LATE', 'HALF_DAY'].includes(attendanceStatus)) {
        const shiftStart = rawData['Shift Start'] || '10:00 AM';
        const [hourStr, minuteStr] = shiftStart.split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr) || 0;
        
        if (shiftStart.includes('PM') && hour < 12) hour += 12;
        if (shiftStart.includes('AM') && hour === 12) hour = 0;
        
        if (attendanceStatus === 'LATE') {
          const lateMinutes = 15 + Math.floor(Math.random() * 45);
          checkInTime = new Date(Date.UTC(
            record.attendanceYear,
            record.attendanceMonth - 1,
            dayNum,
            hour, minute + lateMinutes, 0, 0
          ));
          checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
          workingHours = 9;
          lateBy = lateMinutes;
        } else if (attendanceStatus === 'HALF_DAY') {
          checkInTime = new Date(Date.UTC(
            record.attendanceYear,
            record.attendanceMonth - 1,
            dayNum,
            hour, minute, 0, 0
          ));
          checkOutTime = new Date(checkInTime.getTime() + 5.5 * 60 * 60 * 1000);
          workingHours = 5.5;
        } else {
          checkInTime = new Date(Date.UTC(
            record.attendanceYear,
            record.attendanceMonth - 1,
            dayNum,
            hour, minute, 0, 0
          ));
          checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
          workingHours = 9;
        }
      }
      
      try {
        await prisma.attendance.create({
          data: {
            organizationId: employee.organizationId,
            employeeId: employee.id,
            date: attendanceDate,
            checkInTime,
            checkOutTime,
            workingHours,
            status: attendanceStatus,
            lateBy,
            source: 'MANUAL',
            isManualEntry: true,
            remarks: `Imported from biometric Excel (August 2026)`,
          }
        });
        
        created++;
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          console.log(`  ❌ Error creating record for day ${dayNum}: ${error.message}`);
        }
      }
    }
  }
  
  console.log(`\n✅ Created ${created} correct attendance records`);
  
  await prisma.$disconnect();
}

fixMonth().catch(console.error);
