const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listEmployees() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Total employees found: ${employees.length}\n`);
  employees.forEach(emp => {
    console.log(`${emp.employeeId} - ${emp.firstName} ${emp.lastName}`);
  });
  
  await prisma.$disconnect();
}

listEmployees().catch(console.error);
