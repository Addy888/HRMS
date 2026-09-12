const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseBook1Upload() {
  console.log('\n=== DIAGNOSTIC: Why Book1(2).xlsx Import Shows Success but Calendar Empty ===\n');

  console.log('STEP 1: Check ALL Employees in HRMS Database');
  console.log('==========================================\n');
  
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          email: true
        }
      }
    },
    orderBy: { firstName: 'asc' }
  });

  console.log(`Total Employees: ${employees.length}\n`);
  employees.forEach(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const email = emp.user?.email || 'NO_EMAIL';
    console.log(`  ${emp.employeeId}: ${fullName} <${email}> [UUID: ${emp.id}]`);
  });

  console.log('\n\nSTEP 2: Simulate Name Matching with Excel First Names');
  console.log('=====================================================\n');

  // These are the Excel names from your upload
  const excelNames = [
    'sumaiyya',
    'aman',
    'aditya',
    'akash',
    'poojakale'
  ];

  console.log('Excel Names to Match:');
  excelNames.forEach(name => console.log(`  - ${name}`));
  console.log('');

  function normalizeName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  // Group employees by normalized name
  const employeesByNormalizedName = new Map();
  
  for (const emp of employees) {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const normalizedFull = normalizeName(fullName);
    const normalizedFirst = normalizeName(emp.firstName);
    
    // Match both full name and first name
    [normalizedFull, normalizedFirst].forEach(norm => {
      if (!employeesByNormalizedName.has(norm)) {
        employeesByNormalizedName.set(norm, []);
      }
      employeesByNormalizedName.get(norm).push({
        ...emp,
        fullName,
        matchedBy: norm === normalizedFull ? 'fullName' : 'firstName'
      });
    });
  }

  console.log('Name Matching Results:');
  console.log('======================\n');

  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalAmbiguous = 0;

  excelNames.forEach(excelName => {
    const normalized = normalizeName(excelName);
    const matches = employeesByNormalizedName.get(normalized) || [];

    console.log(`Excel Name: "${excelName}" (normalized: "${normalized}")`);
    
    if (matches.length === 0) {
      console.log(`  ❌ NO MATCH FOUND`);
      totalUnmatched++;
    } else if (matches.length === 1) {
      const match = matches[0];
      console.log(`  ✅ MATCHED (${match.matchedBy}): ${match.employeeId} - ${match.fullName} [UUID: ${match.id}]`);
      totalMatched++;
    } else {
      console.log(`  ⚠️ AMBIGUOUS: ${matches.length} employees match`);
      matches.forEach(m => {
        console.log(`    - ${m.employeeId}: ${m.fullName} (matched by ${m.matchedBy})`);
      });
      totalAmbiguous++;
    }
    console.log('');
  });

  console.log(`\nMatching Summary: ${totalMatched} matched, ${totalUnmatched} unmatched, ${totalAmbiguous} ambiguous\n`);

  console.log('\n\nSTEP 3: Check Attendance Records for Sept 1-12, 2026');
  console.log('==================================================\n');

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
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
    orderBy: [
      { date: 'asc' },
      { employeeId: 'asc' }
    ]
  });

  console.log(`Total Attendance Records: ${attendanceRecords.length}\n`);

  // Group by employee
  const byEmployee = {};
  attendanceRecords.forEach(record => {
    const empId = record.employee?.employeeId || 'UNKNOWN';
    const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'UNKNOWN';
    
    if (!byEmployee[empId]) {
      byEmployee[empId] = {
        name: empName,
        records: []
      };
    }
    
    byEmployee[empId].records.push({
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      checkIn: record.checkInTime,
      checkOut: record.checkOutTime
    });
  });

  Object.keys(byEmployee).sort().forEach(empId => {
    const data = byEmployee[empId];
    console.log(`${empId} - ${data.name}:`);
    console.log(`  Days: ${data.records.length}`);
    data.records.forEach(r => {
      console.log(`    ${r.date}: ${r.status} (In: ${r.checkIn || 'N/A'}, Out: ${r.checkOut || 'N/A'})`);
    });
    console.log('');
  });

  // Check specific employee "Aditya Shastri"
  console.log('\n\nSTEP 4: Check "Aditya Shastri" Specifically');
  console.log('=========================================\n');

  const adityaEmployee = employees.find(e => 
    e.firstName.toLowerCase() === 'aditya' && e.lastName.toLowerCase() === 'shastri'
  );

  if (adityaEmployee) {
    console.log(`✅ Found: ${adityaEmployee.employeeId} - ${adityaEmployee.firstName} ${adityaEmployee.lastName}`);
    console.log(`   Email: ${adityaEmployee.user?.email || 'NO_EMAIL'}`);
    console.log(`   UUID: ${adityaEmployee.id}\n`);

    const adityaAttendance = attendanceRecords.filter(r => r.employeeId === adityaEmployee.id);
    console.log(`Attendance Records: ${adityaAttendance.length}`);
    
    if (adityaAttendance.length > 0) {
      adityaAttendance.forEach(r => {
        console.log(`  ${r.date.toISOString().split('T')[0]}: ${r.status} (In: ${r.checkInTime || 'N/A'}, Out: ${r.checkOutTime || 'N/A'})`);
      });
    } else {
      console.log('  ❌ NO ATTENDANCE RECORDS FOUND');
    }
  } else {
    console.log('❌ Employee "Aditya Shastri" not found in database');
  }

  console.log('\n\nSTEP 5: Check Import History');
  console.log('============================\n');

  const recentImports = await prisma.attendanceImportHistory.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: 10
  });

  console.log(`Recent Imports: ${recentImports.length}\n`);
  recentImports.forEach((imp, idx) => {
    console.log(`${idx + 1}. ${imp.fileName}`);
    console.log(`   Uploaded: ${imp.uploadedAt.toISOString()}`);
    console.log(`   Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Failed: ${imp.failedRows}, Duplicates: ${imp.duplicateRows}`);
    console.log(`   Status: ${imp.status}`);
    console.log('');
  });

  console.log('\n\n=== DIAGNOSIS COMPLETE ===\n');
}

diagnoseBook1Upload()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
