/**
 * Test login credentials and password verification
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔐 Testing Login Credentials...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testEmail = 'adityashastri76@gmail.com';
    const testPassword = '12345678';

    console.log('Test Credentials:');
    console.log('  Email:', testEmail);
    console.log('  Password:', testPassword);
    console.log('  Email (lowercase):', testEmail.toLowerCase());
    console.log('  Email (trimmed):', testEmail.trim());
    console.log('  Email (lowercase + trimmed):', testEmail.toLowerCase().trim());

    // Try to find user exactly as auth service does
    console.log('\n🔍 Searching for user...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail.toLowerCase().trim() },
      include: {
        role: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            phone: true,
            onboardingStatus: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND');
      console.log('   The email does not exist in the database');
      
      // Try to find with different variations
      console.log('\n🔍 Trying other email variations...');
      const userExact = await prisma.user.findFirst({
        where: { email: testEmail },
      });
      if (userExact) {
        console.log('   ✅ Found with exact case:', userExact.email);
      }
      
      const userLower = await prisma.user.findFirst({
        where: { email: testEmail.toLowerCase() },
      });
      if (userLower) {
        console.log('   ✅ Found with lowercase:', userLower.email);
      }
      
      return;
    }

    console.log('✅ USER FOUND');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role.name);
    console.log('   Organization ID:', user.organizationId);
    console.log('   Is Active:', user.isActive);
    console.log('   Is First Login:', user.isFirstLogin);
    console.log('   Password Hash:', user.password.substring(0, 20) + '...');

    // Check if active
    if (!user.isActive) {
      console.log('\n⚠️  ACCOUNT IS INACTIVE');
      return;
    }

    // Test password
    console.log('\n🔐 Testing Password...');
    console.log('   Password to test:', testPassword);
    console.log('   Hash from DB:', user.password.substring(0, 30) + '...');
    
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('   ✅ PASSWORD MATCHES!');
    } else {
      console.log('   ❌ PASSWORD DOES NOT MATCH');
      
      // Test if hash is correct format
      console.log('\n🔍 Testing hash format...');
      const testHash = await bcrypt.hash(testPassword, 10);
      console.log('   New hash for same password:', testHash.substring(0, 30) + '...');
      const testMatch = await bcrypt.compare(testPassword, testHash);
      console.log('   New hash matches:', testMatch);
      
      // Check if stored hash is bcrypt format
      const isBcryptFormat = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
      console.log('   Stored hash is bcrypt format:', isBcryptFormat);
      
      if (!isBcryptFormat) {
        console.log('   ⚠️  Hash is NOT in bcrypt format!');
        console.log('   This might be a plain text password or wrong hash algorithm');
      }
    }

    // Show employee info
    if (user.employee) {
      console.log('\n👤 Employee Profile:');
      console.log('   Employee ID:', user.employee.employeeId);
      console.log('   Name:', user.employee.firstName, user.employee.lastName);
      console.log('   Phone:', user.employee.phone || 'N/A');
      console.log('   Department:', user.employee.department?.name || 'N/A');
      console.log('   Designation:', user.employee.designation?.name || 'N/A');
      console.log('   Onboarding Status:', user.employee.onboardingStatus);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Login test complete\n');

    // Summary
    if (!user) {
      console.log('❌ LOGIN WOULD FAIL: User not found');
    } else if (!user.isActive) {
      console.log('❌ LOGIN WOULD FAIL: Account inactive');
    } else if (!isPasswordValid) {
      console.log('❌ LOGIN WOULD FAIL: Password incorrect');
      console.log('   Action needed: Reset password in database');
    } else {
      console.log('✅ LOGIN SHOULD SUCCEED');
      console.log('   Expected redirect: /super-admin');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
