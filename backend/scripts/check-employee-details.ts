/**
 * Debug Script: Check All Employees and Their Ownership
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployees() {
  console.log('='.repeat(70));
  console.log('EMPLOYEE DETAILS');
  console.log('='.repeat(70));

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          include: {
            role: true,
          },
        },
        createdByUser: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\nTotal Employees: ${employees.length}\n`);

    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.firstName} ${emp.lastName}`);
      console.log(`   Employee ID: ${emp.employeeId}`);
      console.log(`   UUID: ${emp.id}`);
      console.log(`   Email: ${emp.user.email}`);
      console.log(`   User Role: "${emp.user.role.name}"`);
      console.log(`   Organization: ${emp.organization.name}`);
      console.log(`   Created By: ${emp.createdByUser ? emp.createdByUser.email : 'NULL'}`);
      console.log(`   Creator Role: ${emp.createdByUser ? `"${emp.createdByUser.role.name}"` : 'N/A'}`);
      console.log(`   Active: ${emp.user.isActive}`);
      console.log(`   Onboarding Status: ${emp.onboardingStatus}`);
      console.log(`   Created At: ${emp.createdAt}`);
      console.log();
    });

    // Count by role
    const hrProfiles = employees.filter(e => 
      ['HR', 'HR_USER', 'HR_ADMIN', 'Super Admin'].includes(e.user.role.name)
    );
    const employeeProfiles = employees.filter(e => e.user.role.name === 'EMPLOYEE');

    console.log('='.repeat(70));
    console.log(`HR Profiles (should be excluded from counts): ${hrProfiles.length}`);
    console.log(`Employee Profiles (actual employees): ${employeeProfiles.length}`);
    console.log('='.repeat(70));

    // Show HR profiles
    if (hrProfiles.length > 0) {
      console.log('\nHR PROFILES (excluded from employee counts):');
      hrProfiles.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.user.email}) - Role: ${emp.user.role.name}`);
      });
    }

    // Show actual employees
    if (employeeProfiles.length > 0) {
      console.log('\nACTUAL EMPLOYEES (included in counts):');
      employeeProfiles.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.user.email})`);
        console.log(`     Created By: ${emp.createdByUser ? emp.createdByUser.email : 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees()
  .then(() => {
    console.log('\n✅ Complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:');
    console.error(error);
    process.exit(1);
  });
