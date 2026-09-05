import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin...\n');

    // 1. Check if SUPER_ADMIN role exists, if not create it
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      console.log('Creating SUPER_ADMIN role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          displayName: 'Super Admin',
          description: 'Company Owner with full system access',
          level: 100,
          isSystem: true,
          isActive: true,
        },
      });
      console.log('✅ SUPER_ADMIN role created\n');
    } else {
      console.log('✅ SUPER_ADMIN role already exists\n');
    }

    // 2. Get the first organization (or you can specify)
    const organization = await prisma.organization.findFirst({
      where: { isActive: true },
    });

    if (!organization) {
      throw new Error('No active organization found. Please create an organization first.');
    }

    console.log(`📦 Using Organization: ${organization.name} (${organization.code})\n`);

    // 3. Check if super admin user already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        roleId: superAdminRole.id,
        organizationId: organization.id,
      },
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin user already exists for this organization:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   ID: ${existingSuperAdmin.id}\n`);
      return;
    }

    // 4. Create Super Admin user
    const email = 'superadmin@fcs.com';
    const password = 'superadmin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating Super Admin user...');
    const superAdminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId: superAdminRole.id,
        organizationId: organization.id,
        isFirstLogin: true,
        isActive: true,
      },
    });
    console.log('✅ Super Admin user created\n');

    // 5. Create Employee profile for Super Admin
    console.log('Creating Employee profile for Super Admin...');
    const superAdminEmployee = await prisma.employee.create({
      data: {
        employeeId: 'SUPER-ADMIN-001',
        userId: superAdminUser.id,
        organizationId: organization.id,
        firstName: 'Super',
        lastName: 'Admin',
        joiningDate: new Date(),
        onboardingStatus: 'COMPLETED',
      },
    });
    console.log('✅ Employee profile created\n');

    // 6. Create employee profile completion record
    await prisma.employeeProfile.create({
      data: {
        employeeId: superAdminEmployee.id,
        profileCompletion: 100,
      },
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Organization: ${organization.name}`);
    console.log(`Email:        ${email}`);
    console.log(`Password:     ${password}`);
    console.log(`Employee ID:  ${superAdminEmployee.employeeId}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
