const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        employeeId: {
          in: ['FCS0160', 'FCS0131', 'FCS0102', 'FCS0052', 'FCS0036']
        }
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('=== EMPLOYEES FOUND ===');
    console.log(JSON.stringify(employees, null, 2));
    
    // Also check by name matching
    const nameMatches = await prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Aditya', mode: 'insensitive' } },
          { firstName: { contains: 'Aachal', mode: 'insensitive' } },
          { firstName: { contains: 'Aashabai', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\n=== NAME MATCHES ===');
    console.log(JSON.stringify(nameMatches, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();
