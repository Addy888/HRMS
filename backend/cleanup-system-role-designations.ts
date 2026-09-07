/**
 * 🧹 CLEANUP SYSTEM ROLE DESIGNATIONS
 * 
 * This script removes system/authentication roles that were mistakenly created as employee designations.
 * System roles (SUPER_ADMIN, HR_ADMIN, etc.) should ONLY exist in the Role table, NOT in Designation table.
 * 
 * Run: npx ts-node cleanup-system-role-designations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSystemRoleDesignations() {
  try {
    console.log('🧹 Starting cleanup of system role designations...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ✅ CRITICAL FIX: List of system/authentication role names that should NEVER be employee designations
    const systemRoleNames = [
      'SUPER_ADMIN',
      'Super Admin',
      'Platform Super Admin',
      'PLATFORM_SUPER_ADMIN',
      'HR_ADMIN',
      'HR Admin',
      'HR_USER',
      'HR User',
      'HR',
      'EMPLOYEE',
      'Employee',
      'ADMIN',
      'Admin',
    ];

    console.log('Step 1: Finding system role designations...');
    console.log('System role names to remove:', systemRoleNames.join(', '));
    console.log();

    // Find all designations with system role names
    const systemDesignations = await prisma.designation.findMany({
      where: {
        name: {
          in: systemRoleNames,
        },
      },
      include: {
        employees: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (systemDesignations.length === 0) {
      console.log('✅ No system role designations found. Database is clean!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    console.log(`⚠️  Found ${systemDesignations.length} system role designation(s) to clean up:\n`);

    for (const designation of systemDesignations) {
      console.log(`   • ${designation.name} (${designation.organization.name})`);
      console.log(`     ID: ${designation.id}`);
      console.log(`     Employees with this designation: ${designation.employees.length}`);
      
      if (designation.employees.length > 0) {
        console.log(`     ⚠️  WARNING: This designation has ${designation.employees.length} employee(s):`);
        designation.employees.forEach(emp => {
          console.log(`        - ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`);
        });
      }
      console.log();
    }

    // Step 2: Check for employees with these designations
    const totalAffectedEmployees = systemDesignations.reduce((sum, d) => sum + d.employees.length, 0);

    if (totalAffectedEmployees > 0) {
      console.log(`\nStep 2: Handling ${totalAffectedEmployees} affected employee(s)...`);
      console.log('Setting their designation to NULL (can be reassigned later by HR)...\n');

      for (const designation of systemDesignations) {
        if (designation.employees.length > 0) {
          await prisma.employee.updateMany({
            where: {
              designationId: designation.id,
            },
            data: {
              designationId: null,
            },
          });
          console.log(`✅ Unlinked ${designation.employees.length} employee(s) from "${designation.name}"`);
        }
      }
    } else {
      console.log('\nStep 2: No employees affected. Safe to delete.\n');
    }

    // Step 3: Delete the system role designations
    console.log('\nStep 3: Deleting system role designations...\n');

    const deleteResult = await prisma.designation.deleteMany({
      where: {
        name: {
          in: systemRoleNames,
        },
      },
    });

    console.log(`✅ Deleted ${deleteResult.count} system role designation(s)`);

    // Step 4: Verify cleanup
    console.log('\nStep 4: Verifying cleanup...\n');

    const remaining = await prisma.designation.findMany({
      where: {
        name: {
          in: systemRoleNames,
        },
      },
    });

    if (remaining.length === 0) {
      console.log('✅ Verification successful! No system role designations remain.');
    } else {
      console.log(`⚠️  WARNING: ${remaining.length} system role designation(s) still exist!`);
    }

    // Step 5: Show current valid designations
    console.log('\nStep 5: Current valid employee designations in database:\n');

    const allOrgs = await prisma.organization.findMany({
      where: { isActive: true },
      include: {
        designations: {
          include: {
            _count: {
              select: { employees: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    for (const org of allOrgs) {
      console.log(`\n📋 Organization: ${org.name} (${org.code})`);
      if (org.designations.length === 0) {
        console.log('   ⚠️  No designations defined yet. HR should create some.');
      } else {
        org.designations.forEach(desg => {
          console.log(`   • ${desg.name} (${desg._count.employees} employees)`);
        });
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CLEANUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 SUMMARY:');
    console.log(`   • System role designations removed: ${deleteResult.count}`);
    console.log(`   • Employees unlinked: ${totalAffectedEmployees}`);
    console.log(`   • Organizations checked: ${allOrgs.length}`);
    console.log('\n✅ The Employee Creation dropdown will now show ONLY real employee designations!');
    console.log('✅ System roles (SUPER_ADMIN, HR_ADMIN, etc.) remain as authentication roles only.');
    console.log('\n💡 Next steps:');
    console.log('   1. HR can reassign proper designations to affected employees');
    console.log('   2. HR can create new employee designations as needed');
    console.log('   3. Test the employee creation form to verify the fix');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupSystemRoleDesignations()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
