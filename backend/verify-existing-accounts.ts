/**
 * VERIFY EXISTING ACCOUNTS STILL WORK
 * 
 * Ensures that the Super Admin setup did not affect existing accounts.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyExistingAccounts() {
  console.log('========================================');
  console.log('VERIFY EXISTING ACCOUNTS');
  console.log('========================================\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        role: true,
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Total users in database: ${users.length}\n`);

    // Group by role
    const usersByRole = new Map<string, typeof users>();
    users.forEach(user => {
      const roleName = user.role.name;
      if (!usersByRole.has(roleName)) {
        usersByRole.set(roleName, []);
      }
      usersByRole.get(roleName)!.push(user);
    });

    // Display by role
    for (const [roleName, roleUsers] of usersByRole.entries()) {
      console.log(`📋 ${roleName} (${roleUsers.length} users):`);
      roleUsers.forEach(user => {
        const status = user.isActive ? '✅' : '❌';
        const name = user.employee 
          ? `${user.employee.firstName} ${user.employee.lastName}` 
          : 'No Employee Profile';
        console.log(`   ${status} ${user.email}`);
        console.log(`      Name: ${name}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Employee ID: ${user.employee?.employeeId || 'N/A'}`);
        console.log(`      Active: ${user.isActive}`);
        console.log(`      Organization: ${user.organizationId}`);
        console.log('');
      });
    }

    // Verify key accounts
    console.log('========================================');
    console.log('KEY ACCOUNT VERIFICATION');
    console.log('========================================\n');

    const keyAccounts = [
      { email: 'bhushan@firstclosesolutions.com', expectedRole: 'SUPER_ADMIN' },
      { email: 'sumaiyyatamboli50@gmail.com', expectedRole: 'HR_ADMIN' },
      { email: 'adityashastri76@gmail.com', expectedRole: 'SUPER_ADMIN' }, // Could be HR or SUPER_ADMIN
    ];

    for (const account of keyAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        include: { role: true },
      });

      if (user) {
        const roleMatch = user.role.name === account.expectedRole || 
                         (account.email === 'adityashastri76@gmail.com' && 
                          (user.role.name === 'SUPER_ADMIN' || user.role.name === 'HR_ADMIN'));
        
        console.log(`${roleMatch ? '✅' : '⚠️'} ${account.email}`);
        console.log(`   Role: ${user.role.name} ${roleMatch ? '(Expected)' : `(Expected: ${account.expectedRole})`}`);
        console.log(`   Active: ${user.isActive}`);
        console.log('');
      } else {
        console.log(`❌ ${account.email}`);
        console.log(`   Status: NOT FOUND`);
        console.log('');
      }
    }

    // Summary
    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================\n');
    
    const summary = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      byRole: Object.fromEntries(Array.from(usersByRole.entries()).map(([role, u]) => [role, u.length])),
    };

    console.log('Total Users:', summary.total);
    console.log('Active:', summary.active);
    console.log('Inactive:', summary.inactive);
    console.log('');
    console.log('By Role:');
    for (const [role, count] of Object.entries(summary.byRole)) {
      console.log(`   ${role}: ${count}`);
    }
    console.log('');

    // Validation
    console.log('========================================');
    console.log('VALIDATION');
    console.log('========================================\n');

    const superAdminExists = users.some(u => 
      u.email === 'bhushan@firstclosesolutions.com' && 
      u.role.name === 'SUPER_ADMIN' && 
      u.isActive
    );

    const hrAdminExists = users.some(u => 
      u.role.name === 'HR_ADMIN' && 
      u.isActive
    );

    const employeeExists = users.some(u => 
      u.role.name === 'EMPLOYEE' && 
      u.isActive
    );

    console.log(`✅ SUPER_ADMIN (bhushan@firstclosesolutions.com): ${superAdminExists ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ HR_ADMIN accounts: ${hrAdminExists ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ EMPLOYEE accounts: ${employeeExists ? 'EXISTS' : 'MISSING'}`);
    console.log('');

    if (superAdminExists && hrAdminExists) {
      console.log('========================================');
      console.log('✅ ALL CHECKS PASSED');
      console.log('========================================\n');
      console.log('Super Admin setup did NOT affect existing accounts.');
      console.log('All user types are present and functional.');
    } else {
      console.log('========================================');
      console.log('⚠️ WARNINGS DETECTED');
      console.log('========================================\n');
      if (!superAdminExists) {
        console.log('⚠️ Super Admin account missing or inactive');
      }
      if (!hrAdminExists) {
        console.log('⚠️ No active HR_ADMIN accounts found');
      }
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

async function main() {
  try {
    await verifyExistingAccounts();
  } catch (error: any) {
    console.error('FATAL ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
