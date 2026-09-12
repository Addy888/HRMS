const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const employees = await prisma.employee.findMany({
    where: {
      organizationId: '3245af42-a1a7-423c-b7d0-05e7f7046a20',
      firstName: { contains: 'ditya', mode: 'insensitive' }
    },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log('Employees with "ditya" in firstName:');
  employees.forEach(e => {
    console.log(`- ${e.employeeId}: ${e.firstName} ${e.lastName} (UUID: ${e.id})`);
  });
  
  await prisma.$disconnect();
}

check();
