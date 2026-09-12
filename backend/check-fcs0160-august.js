const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const emp = await prisma.employee.findFirst({
    where: { employeeId: 'FCS0160' },
    select: { id: true, employeeId: true }
  });
  
  console.log('FCS0160:', emp);
  
  if (!emp) {
    await prisma.$disconnect();
    return;
  }
  
  // Check all attendance for this employee
  const all = await prisma.attendance.findMany({
    where: { employeeId: emp.id },
    select: {
      id: true,
      date: true,
      status: true,
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`\nTotal attendance for FCS0160: ${all.length}`);
  all.forEach(a => {
    console.log(`  ${a.date.toISOString()} | ${a.status}`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
