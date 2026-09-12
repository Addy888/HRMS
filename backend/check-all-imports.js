const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllImports() {
  console.log('=== ALL ATTENDANCE IMPORT HISTORY RECORDS ===\n');
  
  const allImports = await prisma.attendanceImportHistory.findMany({
    orderBy: { uploadedAt: 'desc' }
  });
  
  if (allImports.length === 0) {
    console.log('❌ NO IMPORT RECORDS FOUND AT ALL!\n');
    console.log('This means the import did not save to AttendanceImportHistory table.');
    console.log('Checking if old HR_Import_History table exists...\n');
  } else {
    console.log(`Found ${allImports.length} import records:\n`);
    allImports.forEach((imp, idx) => {
      console.log(`${idx + 1}. ${imp.fileName}`);
      console.log(`   Uploaded: ${imp.uploadedAt.toISOString()}`);
      console.log(`   Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Failed: ${imp.failedRows}, Duplicates: ${imp.duplicateRows}`);
      console.log(`   Status: ${imp.status}`);
      if (imp.errorReport) {
        console.log(`   Errors: ${imp.errorReport}`);
      }
      console.log('');
    });
  }
  
  console.log('\n=== CHECKING ATTENDANCE TABLE ===\n');
  const attendanceCount = await prisma.attendance.count({
    where: {
      date: {
        gte: new Date('2026-09-01'),
        lte: new Date('2026-09-12')
      }
    }
  });
  
  console.log(`Attendance records for Sept 1-12, 2026: ${attendanceCount}\n`);
  
  if (attendanceCount > 0) {
    const sample = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date('2026-09-01'),
          lte: new Date('2026-09-12')
        }
      },
      include: {
        employee: {
          select: { name: true, email: true }
        }
      },
      take: 10,
      orderBy: { date: 'asc' }
    });
    
    console.log('Sample records:');
    sample.forEach(record => {
      console.log(`  ${record.date.toISOString().split('T')[0]}: ${record.employee?.name || 'UNKNOWN'} - ${record.status}`);
    });
  }
  
  console.log('\n=== CHECKING EMPLOYEES ===\n');
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      email: true
    },
    take: 20
  });
  
  console.log(`Total employees: ${employees.length}`);
  console.log('\nFirst 20 employees:');
  employees.forEach(emp => {
    console.log(`  - ${emp.name} (${emp.email})`);
  });
}

checkAllImports()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
