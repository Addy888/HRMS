const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceRealFCS0002() {
  console.log('\n=== TRACE REAL FCS0002 (Aditya shastri) ===\n');

  const targetUUID = '22a4aca1-4a78-4e36-93a7-69a3b5dd856b';
  const targetOrgId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';

  console.log('STEP 1: Verify Employee FCS0002');
  console.log('================================\n');

  const employee = await prisma.employee.findUnique({
    where: { id: targetUUID },
    include: {
      user: { select: { email: true } }
    }
  });

  if (!employee) {
    console.log(`❌ Employee UUID ${targetUUID} NOT FOUND\n`);
    
    // Search by employeeId
    const byEmpId = await prisma.employee.findFirst({
      where: { employeeId: 'FCS0002' },
      include: { user: { select: { email: true } } }
    });
    
    if (byEmpId) {
      console.log('✅ Found by employeeId FCS0002:');
      console.log(`   UUID: ${byEmpId.id} (DIFFERENT from claimed UUID!)`);
      console.log(`   Name: ${byEmpId.firstName} ${byEmpId.lastName}`);
      console.log(`   Email: ${byEmpId.user?.email}\n`);
    }
    
    return;
  }

  console.log('✅ Employee Found:');
  console.log(`   UUID: ${employee.id}`);
  console.log(`   Employee ID: ${employee.employeeId}`);
  console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
  console.log(`   Email: ${employee.user?.email}`);
  console.log(`   Organization ID: ${employee.organizationId}\n`);

  console.log('\nSTEP 2: Attendance Records for FCS0002 (Sept 2026)');
  console.log('===================================================\n');

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: targetUUID,
      date: {
        gte: new Date('2026-09-01'),
        lte: new Date('2026-09-30')
      }
    },
    orderBy: { date: 'asc' }
  });

  console.log(`Found: ${attendance.length} records\n`);

  if (attendance.length > 0) {
    attendance.forEach(record => {
      console.log(`  ${record.date.toISOString().split('T')[0]}: ${record.status}`);
      console.log(`    In: ${record.checkInTime || 'N/A'}, Out: ${record.checkOutTime || 'N/A'}`);
      console.log(`    Source: ${record.source || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('❌ ZERO attendance records for this employee\n');
  }

  console.log('\nSTEP 3: ALL Employees in Same Organization');
  console.log('==========================================\n');

  const allEmployees = await prisma.employee.findMany({
    where: { organizationId: targetOrgId },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true
    },
    orderBy: { employeeId: 'asc' }
  });

  console.log(`Total Employees in Org: ${allEmployees.length}\n`);
  allEmployees.forEach(emp => {
    const isTarget = emp.id === targetUUID ? ' ← TARGET' : '';
    console.log(`  ${emp.employeeId}: ${emp.firstName} ${emp.lastName} [${emp.id}]${isTarget}`);
  });

  console.log('\n\nSTEP 4: Import History for This Organization');
  console.log('============================================\n');

  const imports = await prisma.attendanceImportHistory.findMany({
    where: { organizationId: targetOrgId },
    orderBy: { uploadedAt: 'desc' }
  });

  console.log(`Total Imports: ${imports.length}\n`);
  imports.forEach((imp, idx) => {
    console.log(`${idx + 1}. ${imp.fileName}`);
    console.log(`   ID: ${imp.id}`);
    console.log(`   Uploaded: ${imp.uploadedAt.toISOString()}`);
    console.log(`   Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Failed: ${imp.failedRows}`);
    console.log(`   Status: ${imp.status}`);
    console.log('');
  });

  const book1Import = imports.find(imp => imp.fileName.toLowerCase().includes('book1'));

  if (!book1Import) {
    console.log('❌ NO Book1 import in this organization\n');
    return;
  }

  console.log(`✅ Found Book1 Import: ${book1Import.fileName}`);
  console.log(`   Import ID: ${book1Import.id}\n`);

  console.log('\nSTEP 5: RawAttendanceRecord for Book1');
  console.log('======================================\n');

  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      importHistoryId: book1Import.id
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total Raw Records: ${rawRecords.length}\n`);

  if (rawRecords.length === 0) {
    console.log('❌ NO raw records\n');
    return;
  }

  const matched = rawRecords.filter(r => r.employeeId !== null);
  const unmatched = rawRecords.filter(r => r.employeeId === null);

  console.log(`Matched: ${matched.length}`);
  console.log(`Unmatched: ${unmatched.length}\n`);

  // Check for FCS0002 specifically
  const fcs0002Raw = rawRecords.filter(r => r.employeeId === targetUUID);
  
  console.log(`Raw Records for FCS0002: ${fcs0002Raw.length}\n`);

  if (fcs0002Raw.length > 0) {
    console.log('FCS0002 Raw Records:');
    fcs0002Raw.slice(0, 10).forEach((record, idx) => {
      console.log(`\n  Record ${idx + 1}:`);
      console.log(`    Original Name: ${record.originalName || 'N/A'}`);
      console.log(`    Is Matched: ${record.isMatched}`);
      console.log(`    Employee ID: ${record.employeeId}`);
      console.log(`    Attendance Date: ${record.attendanceDate || 'N/A'}`);
      console.log(`    Attendance Month: ${record.attendanceMonth || 'N/A'}`);
      console.log(`    Attendance Year: ${record.attendanceYear || 'N/A'}`);
      console.log(`    Matching Note: ${record.matchingNote || 'N/A'}`);
      
      try {
        const rawData = JSON.parse(record.rawData || '{}');
        const keys = Object.keys(rawData);
        console.log(`    Excel Columns: ${keys.slice(0, 5).join(', ')}`);
      } catch (e) {}
    });
  } else {
    console.log('❌ NO raw records matched to FCS0002\n');
    
    // Check if "aditya" exists in any raw record
    let adityaFound = false;
    for (const record of rawRecords.slice(0, 50)) {
      try {
        const rawData = JSON.parse(record.rawData || '{}');
        const nameCol = Object.keys(rawData).find(k => k.toLowerCase().includes('name'));
        if (nameCol) {
          const name = rawData[nameCol].toString().toLowerCase();
          if (name.includes('aditya')) {
            adityaFound = true;
            console.log('\n✅ Found "aditya" in raw record:');
            console.log(`   Original Name: ${record.originalName}`);
            console.log(`   Matched To: ${record.employeeId || 'UNMATCHED'}`);
            console.log(`   Matching Note: ${record.matchingNote || 'N/A'}`);
            console.log(`   Excel Name: ${rawData[nameCol]}`);
            break;
          }
        }
      } catch (e) {}
    }
    
    if (!adityaFound) {
      console.log('\n❌ NO "aditya" found in first 50 raw records\n');
    }
  }

  console.log('\n\nSTEP 6: Attendance Created from Book1 Import');
  console.log('=============================================\n');

  const allMatchedEmployeeIds = [...new Set(matched.map(r => r.employeeId).filter(Boolean))];
  
  if (allMatchedEmployeeIds.length > 0) {
    const attendanceFromBook1 = await prisma.attendance.findMany({
      where: {
        employeeId: { in: allMatchedEmployeeIds },
        date: {
          gte: new Date('2026-09-01'),
          lte: new Date('2026-09-12')
        }
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [{ date: 'asc' }, { employeeId: 'asc' }]
    });

    console.log(`Attendance Records Created: ${attendanceFromBook1.length}\n`);

    if (attendanceFromBook1.length > 0) {
      const byEmp = {};
      attendanceFromBook1.forEach(record => {
        const empId = record.employee?.employeeId || 'UNKNOWN';
        if (!byEmp[empId]) {
          byEmp[empId] = {
            name: record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'UNKNOWN',
            uuid: record.employeeId,
            count: 0
          };
        }
        byEmp[empId].count++;
      });

      Object.keys(byEmp).forEach(empId => {
        const data = byEmp[empId];
        console.log(`  ${empId} - ${data.name}: ${data.count} days`);
      });
    } else {
      console.log('❌ NO ATTENDANCE RECORDS CREATED!\n');
      console.log('💥 BROKEN LAYER: Raw records matched but Attendance NOT created\n');
    }
  } else {
    console.log('❌ NO matched raw records to check\n');
  }

  console.log('\n\n=== ROOT CAUSE ANALYSIS ===\n');
  console.log(`Target: FCS0002 - ${employee.firstName} ${employee.lastName}`);
  console.log(`UUID: ${targetUUID}\n`);
  console.log(`Book1 Import Exists: ${book1Import ? 'YES' : 'NO'}`);
  
  if (book1Import) {
    console.log(`  Total Rows: ${book1Import.totalRows}`);
    console.log(`  Successful: ${book1Import.successfulRows}`);
    console.log(`  Status: ${book1Import.status}\n`);
    
    console.log(`Raw Records: ${rawRecords.length}`);
    console.log(`  Matched: ${matched.length}`);
    console.log(`  Unmatched: ${unmatched.length}\n`);
    
    console.log(`FCS0002 Raw Records: ${fcs0002Raw.length}`);
    console.log(`FCS0002 Attendance Records: ${attendance.length}\n`);
    
    if (fcs0002Raw.length > 0 && attendance.length === 0) {
      console.log('💥 BUG IDENTIFIED:');
      console.log('   Raw records matched to FCS0002 but NO Attendance records created.');
      console.log('   Bug location: processMatchedAttendance() or Attendance creation logic\n');
    } else if (fcs0002Raw.length === 0) {
      console.log('❌ NAME MATCHING FAILED:');
      console.log('   Excel "aditya" did not match FCS0002 during import.');
      console.log('   Check: name matching logic in matchEmployees()\n');
    }
  }
}

traceRealFCS0002()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
