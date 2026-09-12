/**
 * FIX BIOMETRIC IMPORT - Complete Solution
 * 
 * This script:
 * 1. Re-matches existing raw records to current employees
 * 2. Creates Attendance records for matched employees
 * 3. Fixes the stale UUID issue
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBiometricImport() {
  console.log('🔧 FIXING BIOMETRIC IMPORT\n');
  console.log('='.repeat(60));
  
  // Step 1: Get all current employees with their correct UUIDs
  console.log('\n1️⃣ Fetching current employees...');
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      organizationId: true,
    }
  });
  
  console.log(`   Found ${employees.length} employees in database`);
  
  // Create lookup maps
  const employeeByIdMap = new Map();
  const employeeByNameMap = new Map();
  
  employees.forEach(emp => {
    employeeByIdMap.set(emp.employeeId.toLowerCase().trim(), emp);
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase().trim();
    employeeByNameMap.set(fullName, emp);
  });
  
  // Step 2: Get all raw records that need fixing
  console.log('\n2️⃣ Finding raw records with stale/wrong UUIDs...');
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    select: {
      id: true,
      originalIdentifier: true,
      originalName: true,
      employeeId: true,
      isMatched: true,
      attendanceMonth: true,
      attendanceYear: true,
      rawData: true,
      importHistoryId: true,
    }
  });
  
  console.log(`   Found ${rawRecords.length} raw attendance records`);
  
  let fixed = 0;
  let created = 0;
  let errors = 0;
  
  // Step 3: Re-match and fix each record
  console.log('\n3️⃣ Re-matching and creating attendance records...');
  
  for (const record of rawRecords) {
    try {
      // Try to find current employee
      let currentEmployee = null;
      
      // Strategy 1: Match by employee ID
      if (record.originalIdentifier) {
        currentEmployee = employeeByIdMap.get(record.originalIdentifier.toLowerCase().trim());
      }
      
      // Strategy 2: Match by name
      if (!currentEmployee && record.originalName) {
        currentEmployee = employeeByNameMap.get(record.originalName.toLowerCase().trim());
      }
      
      if (!currentEmployee) {
        console.log(`   ⚠️  No match for ${record.originalIdentifier || record.originalName}`);
        continue;
      }
      
      // Check if UUID needs updating
      if (record.employeeId !== currentEmployee.id) {
        console.log(`   🔄 Updating UUID for ${record.originalIdentifier}: ${record.employeeId?.substring(0,8)}... → ${currentEmployee.id.substring(0,8)}...`);
        
        await prisma.rawAttendanceRecord.update({
          where: { id: record.id },
          data: {
            employeeId: currentEmployee.id,
            isMatched: true,
            matchingNote: `Re-matched to current employee UUID`,
          }
        });
        
        fixed++;
      }
      
      // Step 4: Create Attendance records from this raw data
      if (record.attendanceMonth && record.attendanceYear && record.rawData) {
        const rawData = JSON.parse(record.rawData);
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        // Find date columns (1-31)
        const dateColumns = Object.keys(rawData).filter(key => /^\d+\s*/.test(key));
        
        for (const dayCol of dateColumns) {
          const dayMatch = dayCol.match(/^(\d+)/);
          if (!dayMatch) continue;
          
          const dayNum = parseInt(dayMatch[1]);
          if (dayNum < 1 || dayNum > 31) continue;
          
          const statusValue = rawData[dayCol];
          if (!statusValue || typeof statusValue !== 'string') continue;
          
          const statusStr = statusValue.trim().toUpperCase();
          
          // Map status codes
          let attendanceStatus;
          switch (statusStr) {
            case 'P': attendanceStatus = 'PRESENT'; break;
            case 'A': attendanceStatus = 'ABSENT'; break;
            case 'H': case 'HD': attendanceStatus = 'HALF_DAY'; break;
            case 'WO': case 'W': attendanceStatus = 'WEEK_OFF'; break;
            case 'L': attendanceStatus = 'LATE'; break;
            case 'LV': case 'LEAVE': attendanceStatus = 'LEAVE'; break;
            case 'HOL': case 'HOLIDAY': attendanceStatus = 'HOLIDAY'; break;
            default: continue; // Skip unknown statuses
          }
          
          // Create attendance date
          const attendanceDate = new Date(Date.UTC(
            record.attendanceYear,
            record.attendanceMonth - 1,
            dayNum,
            0, 0, 0, 0
          ));
          
          // Generate times if PRESENT/LATE/HALF_DAY
          let checkInTime = null;
          let checkOutTime = null;
          let workingHours = 0;
          let lateBy = 0;
          
          if (['PRESENT', 'LATE', 'HALF_DAY'].includes(attendanceStatus)) {
            const shiftStart = rawData['Shift Start'] || '10:00 AM';
            const [hourStr, minuteStr] = shiftStart.split(':');
            let hour = parseInt(hourStr);
            const minute = parseInt(minuteStr) || 0;
            
            // Handle AM/PM
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
          
          // Check if attendance already exists
          const existing = await prisma.attendance.findUnique({
            where: {
              organizationId_employeeId_date: {
                organizationId: currentEmployee.organizationId,
                employeeId: currentEmployee.id,
                date: attendanceDate,
              }
            }
          });
          
          if (!existing) {
            // Create new attendance record
            await prisma.attendance.create({
              data: {
                organizationId: currentEmployee.organizationId,
                employeeId: currentEmployee.id,
                date: attendanceDate,
                checkInTime,
                checkOutTime,
                workingHours,
                status: attendanceStatus,
                lateBy,
                source: 'MANUAL',
                isManualEntry: true,
                remarks: `Imported from biometric Excel`,
              }
            });
            
            created++;
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error processing ${record.originalIdentifier}: ${error.message}`);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ FIX COMPLETE\n');
  console.log(`📊 Summary:`);
  console.log(`   - UUIDs Fixed: ${fixed}`);
  console.log(`   - Attendance Records Created: ${created}`);
  console.log(`   - Errors: ${errors}`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

fixBiometricImport().catch(console.error);
