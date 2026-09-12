const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceRealImport() {
  console.log('\n=== STEP 1: Find Book1(2).xlsx Import Record ===');
  const importRecord = await prisma.attendanceImportHistory.findFirst({
    where: { 
      fileName: { contains: 'Book1(2)' } 
    },
    orderBy: { uploadedAt: 'desc' }
  });
  
  if (!importRecord) {
    console.log('❌ No import record found for Book1(2).xlsx');
    return;
  }
  
  console.log('✅ Import Record Found:');
  console.log(JSON.stringify(importRecord, null, 2));
  
  console.log('\n=== STEP 2: Check All Employees in HRMS ===');
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  console.log(`Total Employees in HRMS: ${employees.length}`);
  employees.forEach(emp => {
    console.log(`  - ${emp.name} (${emp.email}) [${emp.id}]`);
  });
  
  console.log('\n=== STEP 3: Check Attendance Records Created ===');
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
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { date: 'asc' },
      { employee: { name: 'asc' } }
    ]
  });
  
  console.log(`\nTotal Attendance Records (2026-09-01 to 2026-09-12): ${attendanceRecords.length}`);
  
  // Group by employee
  const byEmployee = {};
  attendanceRecords.forEach(record => {
    const empName = record.employee?.name || 'UNKNOWN';
    if (!byEmployee[empName]) {
      byEmployee[empName] = [];
    }
    byEmployee[empName].push({
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      checkIn: record.checkInTime,
      checkOut: record.checkOutTime,
      employeeId: record.employeeId
    });
  });
  
  console.log('\nAttendance by Employee:');
  Object.keys(byEmployee).sort().forEach(empName => {
    console.log(`\n${empName} (${byEmployee[empName][0].employeeId}):`);
    console.log(`  Total Days: ${byEmployee[empName].length}`);
    byEmployee[empName].forEach(day => {
      console.log(`    ${day.date}: ${day.status} (In: ${day.checkIn || 'N/A'}, Out: ${day.checkOut || 'N/A'})`);
    });
  });
  
  console.log('\n=== STEP 4: Check Aditya Shastri Specifically ===');
  const adityaEmployee = employees.find(e => e.name.toLowerCase().includes('aditya'));
  if (adityaEmployee) {
    console.log(`Found: ${adityaEmployee.name} [${adityaEmployee.id}]`);
    
    const adityaAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: adityaEmployee.id,
        date: {
          gte: new Date('2026-09-01'),
          lte: new Date('2026-09-12')
        }
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`Attendance Records for ${adityaEmployee.name}: ${adityaAttendance.length}`);
    adityaAttendance.forEach(record => {
      console.log(`  ${record.date.toISOString().split('T')[0]}: ${record.status} (In: ${record.checkInTime || 'N/A'}, Out: ${record.checkOutTime || 'N/A'})`);
    });
  } else {
    console.log('❌ No employee found with "aditya" in name');
  }
  
  console.log('\n=== STEP 5: Check Import History Details ===');
  const allImports = await prisma.attendanceImportHistory.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: 5
  });
  
  console.log('\nRecent Import History:');
  allImports.forEach(imp => {
    console.log(`\n${imp.fileName} (${imp.uploadedAt.toISOString()})`);
    console.log(`  Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Failed: ${imp.failedRows}, Duplicates: ${imp.duplicateRows}`);
    console.log(`  Status: ${imp.status}`);
    if (imp.errorReport) {
      console.log(`  Errors: ${imp.errorReport}`);
    }
  });
}

traceRealImport()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
