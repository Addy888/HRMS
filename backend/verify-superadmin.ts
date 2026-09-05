import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifySuperAdmin() {
  try {
    console.log('🔍 Verifying Super Admin account...\n');

    const email = 'superadmin@fcs.com';
    const password = 'superadmin123';

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!user) {
      console.log('❌ Super Admin user NOT FOUND');
      return;
    }

    console.log('✅ Super Admin user found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role.name}`);
    console.log(`   Role ID: ${user.roleId}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   First Login: ${user.isFirstLogin}`);
    if (user.employee) {
      console.log(`   Employee ID: ${user.employee.employeeId}`);
      console.log(`   Name: ${user.employee.firstName} ${user.employee.lastName}`);
    }

    // Test password
    console.log('\n🔐 Testing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT');
    } else {
      console.log('❌ Password is INCORRECT');
    }

    console.log('\n📊 Password hash in database:');
    console.log(`   ${user.password.substring(0, 30)}...`);

    // Test what bcrypt would create for this password
    console.log('\n🧪 Testing bcrypt hash for "superadmin123":');
    const testHash = await bcrypt.hash(password, 10);
    const testMatch = await bcrypt.compare(password, testHash);
    console.log(`   Generated hash: ${testHash.substring(0, 30)}...`);
    console.log(`   Test match: ${testMatch ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperAdmin();
