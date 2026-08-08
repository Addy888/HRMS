/**
 * Migration Script: Assign Employee Ownership
 * 
 * This script assigns `createdByUserId` to existing employees that have NULL values.
 * 
 * Strategy:
 * 1. Find all employees with createdByUserId = NULL
 * 2. For each organization, find the first HR_ADMIN user
 * 3. Assign all NULL employees in that organization to the HR_ADMIN
 * 
 * WHY: Existing employees were created before HR ownership tracking was implemented.
 * We assign them to HR_ADMIN so they remain visible to admins but not to HR_USER accounts.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignEmployeeOwnership() {
  console.log('='.repeat(60));
  console.log('EMPLOYEE OWNERSHIP MIGRATION');
  console.log('='.repeat(60));

  try {
    // Step 1: Find all employees with NULL createdByUserId
    const employeesWithoutOwner = await prisma.employee.findMany({
      where: {
        createdByUserId: null,
      },
      include: {
        organization: true,
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`\nFound ${employeesWithoutOwner.length} employees without ownership\n`);

    if (employeesWithoutOwner.length === 0) {
      console.log('✅ All employees already have ownership assigned!');
      console.log('='.repeat(60));
      return;
    }

    // Step 2: Group employees by organization
    const employeesByOrg: Record<string, typeof employeesWithoutOwner> = {};
    
    for (const employee of employeesWithoutOwner) {
      const orgId = employee.organizationId;
      if (!employeesByOrg[orgId]) {
        employeesByOrg[orgId] = [];
      }
      employeesByOrg[orgId].push(employee);
    }

    console.log(`Organizations affected: ${Object.keys(employeesByOrg).length}\n`);

    // Step 3: For each organization, assign to HR_ADMIN
    for (const [orgId, employees] of Object.entries(employeesByOrg)) {
      const orgName = employees[0].organization.name;
      console.log(`\n📋 Processing Organization: ${orgName} (${orgId})`);
      console.log(`   Employees without owner: ${employees.length}`);

      // Find HR_ADMIN in this organization
      const hrAdmin = await prisma.user.findFirst({
        where: {
          organizationId: orgId,
          role: {
            name: { in: ['HR_ADMIN', 'SUPER_ADMIN'] },
          },
        },
        include: {
          role: true,
          employee: true,
        },
      });

      if (!hrAdmin) {
        console.log(`   ⚠️  No HR_ADMIN found for this organization!`);
        console.log(`   ⚠️  Skipping ${employees.length} employees`);
        continue;
      }

      console.log(`   ✅ Found HR_ADMIN: ${hrAdmin.email} (${hrAdmin.role.name})`);

      // Update all employees in this organization
      const updateResult = await prisma.employee.updateMany({
        where: {
          organizationId: orgId,
          createdByUserId: null,
        },
        data: {
          createdByUserId: hrAdmin.id,
        },
      });

      console.log(`   ✅ Assigned ${updateResult.count} employees to HR_ADMIN`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));

    // Verify the migration
    const remainingNullOwners = await prisma.employee.count({
      where: {
        createdByUserId: null,
      },
    });

    const totalEmployees = await prisma.employee.count();
    const employeesWithOwner = totalEmployees - remainingNullOwners;

    console.log(`\nTotal Employees: ${totalEmployees}`);
    console.log(`Employees with Owner: ${employeesWithOwner}`);
    console.log(`Employees without Owner: ${remainingNullOwners}`);

    if (remainingNullOwners === 0) {
      console.log('\n✅ SUCCESS: All employees now have ownership assigned!');
    } else {
      console.log('\n⚠️  WARNING: Some employees still have NULL ownership');
      console.log('   This may be due to missing HR_ADMIN users in some organizations');
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR during migration:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
assignEmployeeOwnership()
  .then(() => {
    console.log('\n✅ Migration completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  });
