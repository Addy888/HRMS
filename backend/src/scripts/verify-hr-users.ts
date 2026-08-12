/**
 * HR Users Verification Script
 * Displays current HR users in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyHRUsers() {
  console.log('🔍 Verifying HR Users in Database...\n');

  try {
    // Get all HR users
    const hrUsers = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] },
        },
      },
      include: {
        role: true,
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Total HR Users Found: ${hrUsers.length}\n`);

    if (hrUsers.length === 0) {
      console.log('⚠️  No HR users found in the database!\n');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    hrUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. HR User Details:`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   📧 Email:           ${user.email}`);
      console.log(`   👤 Role:            ${user.role.name}`);
      console.log(`   ✓  Active:          ${user.isActive ? 'Yes' : 'No'}`);
      
      if (user.employee) {
        console.log(`   👨‍💼 Name:            ${user.employee.firstName} ${user.employee.lastName}`);
        console.log(`   🆔 Employee ID:     ${user.employee.employeeId}`);
        console.log(`   🏢 Department:      ${user.employee.department?.name || 'Not assigned'}`);
        console.log(`   💼 Designation:     ${user.employee.designation?.name || 'Not assigned'}`);
        console.log(`   📱 Phone:           ${user.employee.phone || 'Not provided'}`);
      } else {
        console.log(`   ⚠️  Employee profile not found`);
      }
      
      console.log(`   📅 Created:         ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   🔄 Updated:         ${new Date(user.updatedAt).toLocaleString()}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check for protected account
    const protectedAccount = hrUsers.find(u => u.email === 'sumaiyyatamboli50@gmail.com');
    
    if (protectedAccount) {
      console.log('✅ PROTECTED ACCOUNT VERIFICATION:');
      console.log(`   Email: ${protectedAccount.email}`);
      console.log(`   Status: SAFE AND ACTIVE`);
      console.log(`   Role: ${protectedAccount.role.name}`);
      console.log(`   Department: ${protectedAccount.employee?.department?.name || 'None'}\n`);
    } else {
      console.log('❌ WARNING: Protected account (sumaiyyatamboli50@gmail.com) NOT FOUND!\n');
    }

    // Summary
    console.log('📋 Summary:');
    console.log(`   Total HR Users: ${hrUsers.length}`);
    console.log(`   Active Users: ${hrUsers.filter(u => u.isActive).length}`);
    console.log(`   Inactive Users: ${hrUsers.filter(u => !u.isActive).length}`);
    console.log(`   HR_ADMIN: ${hrUsers.filter(u => u.role.name === 'HR_ADMIN').length}`);
    console.log(`   HR_USER: ${hrUsers.filter(u => u.role.name === 'HR_USER').length}`);
    console.log(`   HR (Legacy): ${hrUsers.filter(u => u.role.name === 'HR').length}\n`);

    console.log('✅ Verification completed!\n');
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyHRUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
