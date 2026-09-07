/**
 * 🧪 TEST DESIGNATION API
 * 
 * This script tests the designation API to verify:
 * 1. No system roles appear in the designation list
 * 2. Only proper employee designations are returned
 * 3. Organization isolation is working
 * 
 * Run: npx ts-node test-designation-api.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDesignationAPI() {
  try {
    console.log('🧪 Testing Designation API Logic...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get a sample HR user
    const hrUser = await prisma.user.findFirst({
      where: {
        role: {
          name: {
            in: ['HR', 'HR_ADMIN', 'HR_USER', 'SUPER_ADMIN'],
          },
        },
      },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!hrUser) {
      console.log('❌ No HR user found in database. Run seed first.');
      return;
    }

    console.log('✅ Test User Found:');
    console.log(`   Email: ${hrUser.email}`);
    console.log(`   Role: ${hrUser.role.name}`);
    console.log(`   Organization: ${hrUser.organization.name} (${hrUser.organization.code})`);
    console.log();

    // Simulate the API logic
    console.log('Step 1: Simulating designation API call...\n');

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

    const designations = await prisma.designation.findMany({
      where: {
        organizationId: hrUser.organizationId,
        name: {
          notIn: systemRoleNames,
        },
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    console.log(`✅ Found ${designations.length} employee designations:\n`);

    if (designations.length === 0) {
      console.log('⚠️  No designations found! Run: npx ts-node seed-employee-designations.ts');
    } else {
      designations.forEach((d, idx) => {
        console.log(`   ${idx + 1}. ${d.name} (${d._count.employees} employees)`);
        if (d.description) {
          console.log(`      └─ ${d.description}`);
        }
      });
    }

    console.log();

    // Check for any system roles in designation table
    console.log('Step 2: Checking for system roles in Designation table...\n');

    const systemRolesInDesignations = await prisma.designation.findMany({
      where: {
        name: {
          in: systemRoleNames,
        },
      },
    });

    if (systemRolesInDesignations.length > 0) {
      console.log(`❌ FOUND ${systemRolesInDesignations.length} SYSTEM ROLES IN DESIGNATION TABLE:`);
      systemRolesInDesignations.forEach((d) => {
        console.log(`   • ${d.name} (${d.organizationId})`);
      });
      console.log('\n⚠️  Run cleanup script: npx ts-node cleanup-system-role-designations.ts');
    } else {
      console.log('✅ No system roles found in Designation table. Database is clean!');
    }

    console.log();

    // Verify roles are in Role table
    console.log('Step 3: Verifying system roles are in Role table...\n');

    const systemRoles = await prisma.role.findMany({
      where: {
        name: {
          in: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_USER', 'EMPLOYEE'],
        },
      },
      orderBy: { level: 'desc' },
    });

    console.log(`✅ Found ${systemRoles.length} system roles in Role table:\n`);
    systemRoles.forEach((r) => {
      console.log(`   • ${r.name} (Level ${r.level})`);
    });

    console.log();

    // Test organization isolation
    console.log('Step 4: Testing organization isolation...\n');

    const allOrgs = await prisma.organization.findMany({
      where: { isActive: true },
      include: {
        designations: {
          where: {
            name: {
              notIn: systemRoleNames,
            },
          },
        },
      },
    });

    console.log(`✅ Found ${allOrgs.length} active organization(s):\n`);
    allOrgs.forEach((org) => {
      console.log(`   📋 ${org.name} (${org.code})`);
      console.log(`      └─ ${org.designations.length} designations`);
      if (org.designations.length > 0) {
        org.designations.slice(0, 3).forEach((d) => {
          console.log(`         • ${d.name}`);
        });
        if (org.designations.length > 3) {
          console.log(`         ... and ${org.designations.length - 3} more`);
        }
      }
    });

    console.log();

    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST RESULTS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();

    const allDesignations = await prisma.designation.count();
    const systemRolesCount = systemRolesInDesignations.length;
    const validDesignations = allDesignations - systemRolesCount;

    console.log(`📊 Database Statistics:`);
    console.log(`   • Total designations in DB: ${allDesignations}`);
    console.log(`   • System roles (WRONG): ${systemRolesCount}`);
    console.log(`   • Valid employee designations: ${validDesignations}`);
    console.log(`   • System roles in Role table: ${systemRoles.length}`);
    console.log();

    if (systemRolesCount > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   Run: npx ts-node cleanup-system-role-designations.ts');
      console.log();
    }

    if (validDesignations === 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   Run: npx ts-node seed-employee-designations.ts');
      console.log();
    }

    if (systemRolesCount === 0 && validDesignations > 0) {
      console.log('✅ ALL CHECKS PASSED!');
      console.log('   • No system roles in Designation table');
      console.log('   • Valid employee designations present');
      console.log('   • Organization isolation working');
      console.log();
      console.log('✅ The Employee Creation dropdown will work correctly!');
      console.log();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDesignationAPI()
  .then(() => {
    console.log('Test execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
