const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllAttendance() {
  console.log('🔍 CHECKING ALL ATTENDANCE RECORDS\n');
  
  // Check total attendance
  const total = await prisma.attendance.count();
  console.log(`Total Attendance Records: ${total}`);
  
  // Check August 2026 attendance
  const august = await prisma.attendance.findMany({
    where: {
      date: {
        gte: new Date('2026-08-01T00:00:00.000Z'),
        lte: new Date('2026-08-31T23:59:59.999Z'),
      }
    },
    select: {
      id: true,
      date: true,
      status: true,
      employeeId: true,
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
        }
      }
    },
    take: 20,
    orderBy: { date: 'asc' }
  });
  
  console.log(`\nAugust 2026 Records: ${august.length}`);
  if (august.length > 0) {
    console.log('\nSample Records:');
    august.slice(0, 10).forEach(a => {
      console.log(`  ${a.date.toISOString().split('T')[0]} | ${a.employee.employeeId} ${a.employee.firstName} | ${a.status}`);
    });
  }
  
  // Group by employee
  const byEmployee = {};
  august.forEach(a => {
    const empId = a.employee.employeeId;
    byEmployee[empId] = (byEmployee[empId] || 0) + 1;
  });
  
  console.log('\nBy Employee:');
  Object.entries(byEmployee).forEach(([empId, count]) => {
    console.log(`  ${empId}: ${count} days`);
  });
  
  await prisma.$disconnect();
}

checkAllAttendance().catch(console.error);
