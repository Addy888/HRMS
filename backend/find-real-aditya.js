const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findRealAditya() {
  console.log('\n=== FIND REAL ADITYA EMPLOYEE ===\n');

  // Search for any employee with "aditya" in first name
  const allEmployeesTemp = await prisma.employee.findMany({
    include: {
      user: {
        select: { email: true, id: true }
      }
    }
  });
  
  const adityaEmployees = allEmployeesTemp.filter(emp => 
    emp.firstName.toLowerCase().includes('aditya') || 
    emp.lastName.toLowerCase().includes('shastri')
  );

  console.log(`Found ${adityaEmployees.length} employees matching "aditya" or "shastri":\n`);

  if (adityaEmployees.length === 0) {
    console.log('❌ NO EMPLOYEES FOUND\n');
  } else {
    adityaEmployees.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`);
      console.log(`   UUID: ${emp.id}`);
      console.log(`   User ID: ${emp.userId}`);
      console.log(`   User Email: ${emp.user?.email || 'N/A'}`);
      console.log(`   Organization ID: ${emp.organizationId}`);
      console.log('');
    });
  }

  // Check ALL employees
  console.log('\nALL EMPLOYEES IN DATABASE:');
  console.log('==========================\n');

  const allEmployees = await prisma.employee.findMany({
    include: {
      user: {
        select: { email: true }
      }
    },
    orderBy: { firstName: 'asc' }
  });

  console.log(`Total: ${allEmployees.length}\n`);
  allEmployees.forEach((emp, idx) => {
    console.log(`${idx + 1}. ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`);
    console.log(`   UUID: ${emp.id}`);
    console.log(`   Email: ${emp.user?.email || 'N/A'}`);
    console.log('');
  });

  // Check the claimed UUID
  console.log('\nCHECK CLAIMED UUID:');
  console.log('===================\n');
  
  const claimedUUID = '22a4aca1-4a78-4e36-93a7-69a3b5dd856b';
  console.log(`Looking for UUID: ${claimedUUID}\n`);

  const claimedEmployee = await prisma.employee.findUnique({
    where: { id: claimedUUID },
    include: {
      user: { select: { email: true } }
    }
  });

  if (claimedEmployee) {
    console.log('✅ FOUND:');
    console.log(`   ${claimedEmployee.employeeId}: ${claimedEmployee.firstName} ${claimedEmployee.lastName}`);
    console.log(`   Email: ${claimedEmployee.user?.email}`);
  } else {
    console.log('❌ UUID NOT FOUND IN DATABASE\n');
    console.log('This UUID does not exist. The backend log showing this UUID is incorrect.');
  }

  // Check users table for the email
  console.log('\n\nCHECK USERS WITH "aditya":');
  console.log('===========================\n');

  const allUsers = await prisma.user.findMany({
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
  
  const users = allUsers.filter(u => u.email.toLowerCase().includes('aditya'));

  console.log(`Found ${users.length} users with "aditya" in email:\n`);
  users.forEach(user => {
    console.log(`User: ${user.email}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Role ID: ${user.roleId}`);
    if (user.employee) {
      console.log(`  Employee: ${user.employee.employeeId} - ${user.employee.firstName} ${user.employee.lastName}`);
      console.log(`  Employee UUID: ${user.employee.id}`);
    } else {
      console.log(`  Employee: NOT LINKED`);
    }
    console.log('');
  });
}

findRealAditya()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
