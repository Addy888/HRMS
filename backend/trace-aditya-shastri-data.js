const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceAdityaShrastriData() {
  console.log('\n=== READ-ONLY DATA TRACE: Aditya Shastri Attendance ===\n');

  const targetEmployeeUUID = '22a4aca1-4a78-4e36-93a7-69a3b5dd856b';

  console.log('STEP 1: Verify Employee Exists');
  console.log('================================\n');

  const employee = await prisma.employee.findUnique({
    where: { id: targetEmployeeUUID },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      organizationId: true,
      user: {
        select: { email: true }
      }
    }
  });

  if (!employee) {
    console.log(`❌ Employee UUID ${targetEmployeeUUID} NOT FOUND`);
    return;
  }

  console.log('✅ Employee Found:');
  console.log(`   UUID: ${employee.id}`);
  console.log(`   Employee ID: ${employee.employeeId}`);
  console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
  console.log(`   Email: ${employee.user?.email || 'N/A'}`);
  console.log(`   Organization ID: ${employee.organizationId}\n`);

  console.log('\nSTEP 2: Query Attendance for THIS Employee (Sept 2026)');
  console.log('=======================================================\n');

  const adityaAttendance = await prisma.attendance.findMany({
    where: {
      employeeId: targetEmployeeUUID,
      date: {
        gte: new Date('2026-09-01'),
        lte: new Date('2026-09-30')
      }
    },
    orderBy: { date: 'asc' }
  });

  console.log(`Records Found: ${adityaAttendance.length}\n`);

  if (adityaAttendance.length > 0) {
    console.log('Attendance Records:');
    adityaAttendance.forEach(record => {
      console.log(`  ${record.date.toISOString().split('T')[0]}: ${record.status}`);
      console.log(`    Check In: ${record.checkInTime || 'N/A'}`);
      console.log(`    Check Out: ${record.checkOutTime || 'N/A'}`);
      console.log(`    Source: ${record.source || 'N/A'}`);
      console.log(`    ID: ${record.id}`);
      console.log('');
    });
  } else {
    console.log('❌ ZERO ATTENDANCE RECORDS FOUND FOR THIS EMPLOYEE\n');
  }

  console.log('\nSTEP 3: Query ALL Biometric Attendance (Sept 2026, Org)');
  console.log('========================================================\n');

  const allBiometricAttendance = await prisma.attendance.findMany({
    where: {
      organizationId: employee.organizationId,
      date: {
        gte: new Date('2026-09-01'),
        lte: new Date('2026-09-30')
      },
      source: 'BIOMETRIC'
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

  console.log(`Total Biometric Records (Sept 2026): ${allBiometricAttendance.length}\n`);

  if (allBiometricAttendance.length > 0) {
    // Group by employee
    const byEmployee = {};
    allBiometricAttendance.forEach(record => {
      const empId = record.employee?.employeeId || 'UNKNOWN';
      const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'UNKNOWN';
      
      if (!byEmployee[empId]) {
        byEmployee[empId] = {
          uuid: record.employeeId,
          name: empName,
          records: []
        };
      }
      
      byEmployee[empId].records.push({
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        checkIn: record.checkInTime,
        checkOut: record.checkOutTime,
        source: record.source
      });
    });

    Object.keys(byEmployee).sort().forEach(empId => {
      const data = byEmployee[empId];
      console.log(`${empId} - ${data.name} [${data.uuid}]:`);
      console.log(`  Days: ${data.records.length}`);
      data.records.slice(0, 5).forEach(r => {
        console.log(`    ${r.date}: ${r.status} (In: ${r.checkIn || 'N/A'}, Out: ${r.checkOut || 'N/A'}) [${r.source}]`);
      });
      if (data.records.length > 5) {
        console.log(`    ... and ${data.records.length - 5} more days`);
      }
      console.log('');
    });
  } else {
    console.log('❌ NO BIOMETRIC ATTENDANCE RECORDS IN ORGANIZATION\n');
  }

  console.log('\nSTEP 4: Check Book1(2).xlsx Import History');
  console.log('==========================================\n');

  const book1Import = await prisma.attendanceImportHistory.findFirst({
    where: {
      fileName: { contains: 'Book1' }
    },
    orderBy: { uploadedAt: 'desc' }
  });

  if (!book1Import) {
    console.log('❌ NO IMPORT RECORD FOR Book1(2).xlsx\n');
    console.log('This means the file was NEVER uploaded through the system.\n');
  } else {
    console.log('✅ Import Record Found:');
    console.log(`   ID: ${book1Import.id}`);
    console.log(`   Filename: ${book1Import.fileName}`);
    console.log(`   Uploaded: ${book1Import.uploadedAt.toISOString()}`);
    console.log(`   Total Rows: ${book1Import.totalRows}`);
    console.log(`   Successful: ${book1Import.successfulRows}`);
    console.log(`   Failed: ${book1Import.failedRows}`);
    console.log(`   Duplicates: ${book1Import.duplicateRows}`);
    console.log(`   Status: ${book1Import.status}`);
    console.log(`   Organization ID: ${book1Import.organizationId}\n`);

    if (book1Import.errorReport) {
      console.log('   Error Report:');
      try {
        const errors = JSON.parse(book1Import.errorReport);
        console.log(JSON.stringify(errors, null, 2));
      } catch (e) {
        console.log(book1Import.errorReport);
      }
      console.log('');
    }

    console.log('\nSTEP 5: Check RawAttendanceRecord for This Import');
    console.log('=================================================\n');

    const rawRecords = await prisma.rawAttendanceRecord.findMany({
      where: {
        importHistoryId: book1Import.id
      },
      orderBy: { createdAt: 'asc' },
      take: 200
    });

    console.log(`Total Raw Records: ${rawRecords.length}\n`);

    if (rawRecords.length > 0) {
      // Analyze matching
      const matched = rawRecords.filter(r => r.employeeId !== null);
      const unmatched = rawRecords.filter(r => r.employeeId === null);

      console.log(`Matched: ${matched.length}, Unmatched: ${unmatched.length}\n`);

      // Check for Aditya specifically
      const adityaRawRecords = rawRecords.filter(r => {
        try {
          const rawData = JSON.parse(r.rawData || '{}');
          const nameCol = Object.keys(rawData).find(k => k.toLowerCase().includes('name'));
          if (nameCol) {
            const name = rawData[nameCol].toString().toLowerCase();
            return name.includes('aditya');
          }
        } catch (e) {}
        return false;
      });

      console.log(`Raw Records with "aditya" in name: ${adityaRawRecords.length}\n`);

      if (adityaRawRecords.length > 0) {
        console.log('Aditya Raw Records Details:');
        adityaRawRecords.slice(0, 10).forEach((record, idx) => {
          console.log(`\n  Record ${idx + 1}:`);
          console.log(`    Original Name: ${record.originalName || 'N/A'}`);
          console.log(`    Matched Employee ID: ${record.employeeId || 'NOT MATCHED'}`);
          console.log(`    Is Matched: ${record.isMatched}`);
          console.log(`    Attendance Date: ${record.attendanceDate || 'N/A'}`);
          console.log(`    Attendance Month: ${record.attendanceMonth || 'N/A'}`);
          console.log(`    Attendance Year: ${record.attendanceYear || 'N/A'}`);
          console.log(`    Matching Note: ${record.matchingNote || 'N/A'}`);
          
          if (record.employeeId) {
            console.log(`    ✅ Matched to UUID: ${record.employeeId}`);
            console.log(`    ⚠️ Target UUID: ${targetEmployeeUUID}`);
            console.log(`    Match Check: ${record.employeeId === targetEmployeeUUID ? '✅ CORRECT' : '❌ WRONG EMPLOYEE'}`);
          }

          try {
            const rawData = JSON.parse(record.rawData || '{}');
            console.log(`    Raw Data Sample: ${JSON.stringify(rawData).slice(0, 200)}...`);
          } catch (e) {
            console.log(`    Raw Data: ${record.rawData}`);
          }
        });

        if (adityaRawRecords.length > 10) {
          console.log(`\n  ... and ${adityaRawRecords.length - 10} more Aditya records`);
        }
      } else {
        console.log('❌ NO raw records found with "aditya" in name\n');
      }

      // Show sample of unmatched records
      if (unmatched.length > 0) {
        console.log('\n\nSample Unmatched Records:');
        unmatched.slice(0, 5).forEach((record, idx) => {
          console.log(`\n  Unmatched ${idx + 1}:`);
          console.log(`    Original Name: ${record.originalName || 'N/A'}`);
          console.log(`    Matching Note: ${record.matchingNote || 'N/A'}`);
          try {
            const rawData = JSON.parse(record.rawData || '{}');
            const nameCol = Object.keys(rawData).find(k => k.toLowerCase().includes('name'));
            if (nameCol) {
              console.log(`    Excel Name: ${rawData[nameCol]}`);
            }
          } catch (e) {}
        });
      }
    } else {
      console.log('❌ NO RAW RECORDS FOUND FOR THIS IMPORT\n');
    }
  }

  console.log('\n\nSTEP 6: Check ALL Employees in Organization');
  console.log('==========================================\n');

  const allEmployees = await prisma.employee.findMany({
    where: {
      organizationId: employee.organizationId
    },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true
    },
    orderBy: { firstName: 'asc' }
  });

  console.log(`Total Employees: ${allEmployees.length}\n`);
  allEmployees.forEach(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const isTarget = emp.id === targetEmployeeUUID ? ' ← TARGET EMPLOYEE' : '';
    console.log(`  ${emp.employeeId}: ${fullName} [${emp.id}]${isTarget}`);
  });

  console.log('\n\nSTEP 7: Name Matching Simulation');
  console.log('=================================\n');

  const normalizedNames = new Map();
  allEmployees.forEach(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const normalizedFull = fullName.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedFirst = emp.firstName.toLowerCase().trim();

    [normalizedFull, normalizedFirst].forEach(norm => {
      if (!normalizedNames.has(norm)) {
        normalizedNames.set(norm, []);
      }
      normalizedNames.get(norm).push(emp);
    });
  });

  const testNames = ['aditya', 'aditya shastri', 'sumaiyya'];
  
  console.log('Testing Excel Names:');
  testNames.forEach(excelName => {
    const normalized = excelName.toLowerCase().trim().replace(/\s+/g, ' ');
    const matches = normalizedNames.get(normalized) || [];
    
    console.log(`\n  Excel: "${excelName}" (normalized: "${normalized}")`);
    if (matches.length === 0) {
      console.log('    ❌ NO MATCH');
    } else if (matches.length === 1) {
      const match = matches[0];
      const isTarget = match.id === targetEmployeeUUID ? ' ← TARGET' : '';
      console.log(`    ✅ MATCHED: ${match.employeeId} - ${match.firstName} ${match.lastName}${isTarget}`);
    } else {
      console.log(`    ⚠️ AMBIGUOUS: ${matches.length} matches`);
      matches.forEach(m => {
        console.log(`       - ${m.employeeId}: ${m.firstName} ${m.lastName}`);
      });
    }
  });

  console.log('\n\n=== SUMMARY ===\n');
  console.log(`Target Employee: ${employee.firstName} ${employee.lastName} [${employee.employeeId}]`);
  console.log(`Target UUID: ${targetEmployeeUUID}`);
  console.log(`Attendance Records (Sept 2026): ${adityaAttendance.length}`);
  console.log(`Biometric Records in Org (Sept 2026): ${allBiometricAttendance.length}`);
  console.log(`Book1 Import Exists: ${book1Import ? 'YES' : 'NO'}`);
  
  if (book1Import) {
    console.log(`Book1 Total Rows: ${book1Import.totalRows}`);
    console.log(`Book1 Successful: ${book1Import.successfulRows}`);
    console.log(`Book1 Failed: ${book1Import.failedRows}`);
  }

  console.log('\n');
}

traceAdityaShrastriData()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
