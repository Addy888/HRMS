const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmployeeNames() {
  console.log('👥 CHECKING EMPLOYEE NAMES IN HRMS\n');
  
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  console.log(`Found ${employees.length} employees:\n`);
  employees.forEach(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
    const normalized = fullName.toLowerCase().replace(/\s+/g, ' ').trim();
    console.log(`${emp.employeeId.padEnd(20)} | Full: "${fullName.padEnd(25)}" | Normalized: "${normalized}"`);
  });
  
  await prisma.$disconnect();
}

checkEmployeeNames().catch(console.error);
