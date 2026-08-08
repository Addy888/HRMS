/**
 * Production Admin Account Creation Script
 * 
 * Creates a production-ready HR_ADMIN account for first-time login
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createProductionAdmin() {
  console.log('═'.repeat(80));
  console.log('PRODUCTION HR_ADMIN ACCOUNT SETUP');
  console.log('═'.repeat(80));

  try {
    // Get admin details
    console.log('\nPlease enter the production admin details:\n');
    
    const email = await question('Email address: ');
    const password = await question('Password (min 8 characters): ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const organizationName = await question('Organization Name: ');

    // Validate
    if (!email || !password || !firstName || !lastName || !organizationName) {
      console.log('\n❌ All fields are required!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 8) {
      console.log('\n❌ Password must be at least 8 characters!');
      rl.close();
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`\n❌ User with email ${email} already exists!`);
      rl.close();
      process.exit(1);
    }

    console.log('\n🔄 Creating production admin account...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get or create organization
    let organization = await prisma.organization.findFirst({
      where: { name: organizationName },
    });

    if (!organization) {
      console.log(`   Creating organization: ${organizationName}`);
      organization = await prisma.organization.create({
        data: {
          name: organizationName,
          code: `ORG-${organizationName.toUpperCase().replace(/\s+/g, '-').substring(0, 10)}`,
          isActive: true,
        },
      });
    } else {
      console.log(`   Using existing organization: ${organizationName}`);
    }

    // Get HR_ADMIN role
    const hrAdminRole = await prisma.role.findUnique({
      where: { name: 'HR_ADMIN' },
    });

    if (!hrAdminRole) {
      console.log('\n❌ HR_ADMIN role not found in database!');
      console.log('   Please run: npx prisma migrate deploy');
      rl.close();
      process.exit(1);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId: hrAdminRole.id,
        organizationId: organization.id,
        isFirstLogin: true,
        isActive: true,
      },
    });

    // Create employee profile
    const employee = await prisma.employee.create({
      data: {
        employeeId: 'FCS-HR-ADMIN-001',
        userId: user.id,
        organizationId: organization.id,
        createdByUserId: user.id,
        firstName,
        lastName,
        joiningDate: new Date(),
        onboardingStatus: 'VERIFIED',
      },
    });

    // Create employee profile tracker
    await prisma.employeeProfile.create({
      data: {
        employeeId: employee.id,
        profileCompletion: 100,
      },
    });

    console.log('\n✅ Production admin account created successfully!\n');
    console.log('═'.repeat(80));
    console.log('LOGIN CREDENTIALS');
    console.log('═'.repeat(80));
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: HR_ADMIN`);
    console.log(`   Organization: ${organizationName}`);
    console.log('═'.repeat(80));
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Save these credentials securely');
    console.log('   2. Change password after first login');
    console.log('   3. Do not share these credentials');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR creating admin account:');
    console.error(error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createProductionAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });
