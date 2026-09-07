/**
 * Test superadmin@fcs.com login
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔐 Testing superadmin@fcs.com login...\n');

    const testEmail = 'superadmin@fcs.com';
    const testPassword = 'Admin@123';

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: testEmail.toLowerCase().trim() },
      include: {
        role: true,
        organization: true,
      },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND');
      return;
    }

    console.log('✅ USER FOUND');
    console.log('   Email:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Role:', user.role.name);
    console.log('   Is Active:', user.isActive);
    console.log('   Organization:', user.organization.name);
    console.log('   Organization Active:', user.organization.isActive);

    if (!user.isActive) {
      console.log('\n❌ ACCOUNT INACTIVE');
      return;
    }

    if (!user.organization.isActive) {
      console.log('\n❌ ORGANIZATION INACTIVE');
      return;
    }

    // Test password
    console.log('\n🔐 Testing Password...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('   ✅ PASSWORD MATCHES!');
    } else {
      console.log('   ❌ PASSWORD DOES NOT MATCH');
      return;
    }

    console.log('\n✅ LOGIN SHOULD SUCCEED');
    console.log('   Expected redirect: /super-admin');

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
