const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listEmployeeUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { name: 'EMPLOYEE' }
      },
      select: {
        email: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      take: 20
    });
    
    console.log('=== EMPLOYEE USERS ===\n');
    users.forEach(u => {
      if (u.employee) {
        console.log(`${u.email}`);
        console.log(`  → ${u.employee.employeeId}: ${u.employee.firstName} ${u.employee.lastName}`);
        console.log(`  → UUID: ${u.employee.id}\n`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listEmployeeUsers();
