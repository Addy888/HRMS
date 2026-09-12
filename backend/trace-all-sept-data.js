const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceAllSeptData() {
  console.log('\n=== COMPLETE SEPTEMBER 2026 DATA TRACE ===\n');

  console.log('STEP 1: ALL Import History');
  console.log('===========================\n');

  const allImports = await prisma.attendanceImportHistory.findMany({
    orderBy: { uploadedAt: 'desc' }
  });

  console.log(`Total Imports: ${allImports.length}\n`);
  allImports.forEach((imp, idx) => {
    console.log(`${idx + 1}. ${imp.fileName}`);
    console.log(`   ID: ${imp.id}`);
    console.log(`   Uploaded: ${imp.uploadedAt.toISOString()}`);
    console.log(`   Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Failed: ${imp.failedRows}, Duplicates: ${imp.duplicateRows}`);
    console.log(`   Status: ${imp.status}`);
    console.log('');
  });

  const book1Import = allImports.find(imp => imp.fileName.toLowerCase().includes('book1'));

  if (!book1Import) {
    console.log('❌ NO Book1 import found\n');
    return;
  }

  console.log(`\n✅ Found Book1 Import: ${book1Import.fileName}`);
  console.log(`   Import ID: ${book1Import.id}\n`);

  console.log('\nSTEP 2: RawAttendanceRecord for Book1');
  console.log('======================================\n');

  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      importHistoryId: book1Import.id
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total Raw Records: ${rawRecords.length}\n`);

  if (rawRecords.length === 0) {
    console.log('❌ NO RAW RECORDS - Import may have failed\n');
    return;
  }

  // Analyze raw records
  const matched = rawRecords.filter(r => r.employeeId !== null);
  const unmatched = rawRecords.filter(r => r.employeeId === null);

  console.log(`Matched: ${matched.length}`);
  console.log(`Unmatched: ${unmatched.length}\n`);

  // Group by employee
  const byEmployee = {};
  matched.forEach(record => {
    if (!byEmployee[record.employeeId]) {
      byEmployee[record.employeeId] = [];
    }
    byEmployee[record.employeeId].push(record);
  });

  console.log(`Unique Employees Matched: ${Object.keys(byEmployee).length}\n`);

  // Get employee details
  const employeeIds = Object.keys(byEmployee);
  const employees = await prisma.employee.findMany({
    where: {
      id: { in: employeeIds }
    },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true
    }
  });

  const employeeMap = {};
  employees.forEach(emp => {
    employeeMap[emp.id] = emp;
  });

  console.log('Matched Raw Records by Employee:');
  Object.keys(byEmployee).forEach(empUUID => {
    const emp = employeeMap[empUUID];
    const records = byEmployee[empUUID];
    
    if (emp) {
      console.log(`\n  ${emp.employeeId} - ${emp.firstName} ${emp.lastName} [${empUUID}]:`);
      console.log(`    Raw Records: ${records.length}`);
      console.log(`    Dates: ${records.map(r => r.attendanceDate).filter(Boolean).slice(0, 5).join(', ')}${records.length > 5 ? '...' : ''}`);
    } else {
      console.log(`\n  UNKNOWN EMPLOYEE [${empUUID}]:`);
      console.log(`    Raw Records: ${records.length}`);
    }
  });

  console.log('\n\nSample Unmatched Records:');
  unmatched.slice(0, 10).forEach((record, idx) => {
    console.log(`\n  Unmatched ${idx + 1}:`);
    console.log(`    Original Name: ${record.originalName || 'N/A'}`);
    console.log(`    Matching Note: ${record.matchingNote || 'N/A'}`);
    console.log(`    Date: ${record.attendanceDate || 'N/A'}`);
    
    try {
      const rawData = JSON.parse(record.rawData || '{}');
      const keys = Object.keys(rawData);
      console.log(`    Raw Data Keys: ${keys.slice(0, 5).join(', ')}`);
      
      const nameCol = keys.find(k => k.toLowerCase().includes('name'));
      if (nameCol) {
        console.log(`    Excel Name: ${rawData[nameCol]}`);
      }
    } catch (e) {}
  });

  console.log('\n\nSTEP 3: Attendance Table Records from Book1 Import');
  console.log('===================================================\n');

  // Check if Attendance records were created
  const attendanceFromBook1 = await prisma.attendance.findMany({
    where: {
      source: 'BIOMETRIC',
      date: {
        gte: new Date('2026-09-01'),
        lte: new Date('2026-09-12')
      },
      employeeId: { in: employeeIds.length > 0 ? employeeIds : ['none'] }
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
    orderBy: [
      { date: 'asc' },
      { employeeId: 'asc' }
    ]
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
          records: []
        };
      }
      byEmp[empId].records.push(record);
    });

    Object.keys(byEmp).forEach(empId => {
      const data = byEmp[empId];
      console.log(`${empId} - ${data.name} [${data.uuid}]:`);
      console.log(`  Days: ${data.records.length}`);
      data.records.slice(0, 3).forEach(r => {
        console.log(`    ${r.date.toISOString().split('T')[0]}: ${r.status} (In: ${r.checkInTime || 'N/A'}, Out: ${r.checkOutTime || 'N/A'})`);
      });
      if (data.records.length > 3) {
        console.log(`    ... and ${data.records.length - 3} more`);
      }
      console.log('');
    });
  } else {
    console.log('❌ NO ATTENDANCE RECORDS CREATED FROM MATCHED RAW RECORDS!\n');
    console.log('This is the broken layer: Raw records matched but Attendance not created.\n');
  }

  console.log('\nSTEP 4: ALL September Attendance (Any Source)');
  console.log('==============================================\n');

  const allSeptAttendance = await prisma.attendance.findMany({
    where: {
      date: {
        gte: new Date('2026-09-01'),
        lte: new Date('2026-09-30')
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
    orderBy: [{ date: 'asc' }, { employeeId: 'asc' }],
    take: 50
  });

  console.log(`Total September Attendance: ${allSeptAttendance.length}\n`);

  const byEmpAll = {};
  allSeptAttendance.forEach(record => {
    const empId = record.employee?.employeeId || 'UNKNOWN';
    if (!byEmpAll[empId]) {
      byEmpAll[empId] = {
        name: record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'UNKNOWN',
        records: []
      };
    }
    byEmpAll[empId].records.push(record);
  });

  Object.keys(byEmpAll).forEach(empId => {
    const data = byEmpAll[empId];
    console.log(`${empId} - ${data.name}:`);
    console.log(`  Days: ${data.records.length}`);
    console.log(`  Sources: ${[...new Set(data.records.map(r => r.source))].join(', ')}`);
    console.log('');
  });

  console.log('\n=== ROOT CAUSE ANALYSIS ===\n');
  console.log(`Book1 Import: ${book1Import.fileName}`);
  console.log(`  Status: ${book1Import.status}`);
  console.log(`  Total Rows: ${book1Import.totalRows}`);
  console.log(`  Successful: ${book1Import.successfulRows}`);
  console.log(`  Failed: ${book1Import.failedRows}\n`);
  
  console.log(`Raw Records: ${rawRecords.length}`);
  console.log(`  Matched: ${matched.length}`);
  console.log(`  Unmatched: ${unmatched.length}\n`);
  
  console.log(`Attendance Records Created: ${attendanceFromBook1.length}\n`);
  
  if (book1Import.successfulRows > 0 && attendanceFromBook1.length === 0) {
    console.log('❌ BROKEN LAYER IDENTIFIED:');
    console.log('   Import shows "successful" but NO Attendance records exist.');
    console.log('   The success count is counting RAW record storage, not Attendance creation.\n');
  }

  if (matched.length > 0 && attendanceFromBook1.length === 0) {
    console.log('❌ BROKEN LAYER CONFIRMED:');
    console.log('   Raw records MATCHED employees but Attendance records NOT CREATED.');
    console.log('   Bug is in: processMatchedAttendance() or importRawAttendanceRow()\n');
  }
}

traceAllSeptData()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
