/**
 * PRODUCTION SUPER ADMIN SETUP
 * 
 * Creates/configures the production Super Admin account:
 * Email: bhushan@firstclosesolutions.com
 * Password: FCS@123 (securely hashed with bcrypt)
 * Role: SUPER_ADMIN
 * Access: Super Admin Panel (/super-admin)
 * 
 * ⚠️ PRODUCTION REQUIREMENTS:
 * - Uses REAL production database
 * - Password securely hashed using bcrypt (same as existing system)
 * - NO plain-text password storage
 * - Updates existing account if found
 * - Creates new account if not found
 * - Does NOT delete or modify other users/data
 * - Does NOT reset database
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupProductionSuperAdmin() {
  console.log('========================================');
  console.log('PRODUCTION SUPER ADMIN SETUP');
  console.log('========================================\n');

  const SUPERADMIN_EMAIL = 'bhushan@firstclosesolutions.com';
  const SUPERADMIN_PASSWORD = 'FCS@123';
  const SUPERADMIN_FIRSTNAME = 'Bhushan';
  const SUPERADMIN_LASTNAME = 'Jagtap';

  try {
    // Step 1: Ensure default organization exists (required for SUPER_ADMIN)
    console.log('Step 1: Ensuring default organization exists...');
    const defaultOrg = await prisma.organization.upsert({
      where: { code: 'ORG-DEFAULT' },
      update: {},
      create: {
        name: 'First Close Solutions',
        code: 'ORG-DEFAULT',
        email: 'info@firstclosesolutions.com',
        phone: '1234567890',
        isActive: true,
      },
    });
    console.log(`✅ Organization: ${defaultOrg.name} (${defaultOrg.code})\n`);

    // Step 2: Ensure SUPER_ADMIN role exists
    console.log('Step 2: Ensuring SUPER_ADMIN role exists...');
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {
        displayName: 'Super Admin',
        description: 'Company Owner - Full access within organization',
        level: 100,
        isSystem: true,
        isActive: true,
      },
      create: {
        name: 'SUPER_ADMIN',
        displayName: 'Super Admin',
        description: 'Company Owner - Full access within organization',
        level: 100,
        isSystem: true,
        isActive: true,
      },
    });
    console.log(`✅ Role: ${superAdminRole.name} (ID: ${superAdminRole.id})\n`);

    // Step 3: Hash the password securely using bcrypt (same as auth.service.ts)
    console.log('Step 3: Hashing password securely with bcrypt...');
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
    console.log(`✅ Password hashed (NOT stored in plain text)\n`);

    // Step 4: Check if user already exists
    console.log('Step 4: Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL },
      include: {
        role: true,
        employee: true,
      },
    });

    if (existingUser) {
      console.log(`⚠️  User already exists: ${SUPERADMIN_EMAIL}`);
      console.log(`   Current Role: ${existingUser.role.name}`);
      console.log(`   Current Organization ID: ${existingUser.organizationId}\n`);

      // Update existing user
      console.log('Step 5: Updating existing user...');
      const updatedUser = await prisma.user.update({
        where: { email: SUPERADMIN_EMAIL },
        data: {
          password: hashedPassword,
          roleId: superAdminRole.id,
          organizationId: defaultOrg.id,
          isActive: true,
          isFirstLogin: false,
        },
        include: {
          role: true,
        },
      });
      console.log(`✅ User updated successfully`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role.name}`);
      console.log(`   Organization ID: ${updatedUser.organizationId}`);
      console.log(`   Is Active: ${updatedUser.isActive}`);
      console.log(`   Password: Securely updated (bcrypt hash)\n`);

      // Update employee profile if exists
      if (existingUser.employee) {
        console.log('Step 6: Updating employee profile...');
        const updatedEmployee = await prisma.employee.update({
          where: { id: existingUser.employee.id },
          data: {
            firstName: SUPERADMIN_FIRSTNAME,
            lastName: SUPERADMIN_LASTNAME,
            organizationId: defaultOrg.id,
          },
        });
        console.log(`✅ Employee profile updated: ${updatedEmployee.employeeId}\n`);
      } else {
        // Create employee profile if it doesn't exist
        console.log('Step 6: Creating employee profile...');
        const newEmployee = await prisma.employee.create({
          data: {
            employeeId: `FCS-SA-${Date.now()}`,
            userId: updatedUser.id,
            organizationId: defaultOrg.id,
            firstName: SUPERADMIN_FIRSTNAME,
            lastName: SUPERADMIN_LASTNAME,
            onboardingStatus: 'VERIFIED',
          },
        });
        console.log(`✅ Employee profile created: ${newEmployee.employeeId}\n`);
      }
    } else {
      console.log(`✅ User does not exist. Creating new account...\n`);

      // Create new user
      console.log('Step 5: Creating new Super Admin user...');
      const newUser = await prisma.user.create({
        data: {
          email: SUPERADMIN_EMAIL,
          password: hashedPassword,
          roleId: superAdminRole.id,
          organizationId: defaultOrg.id,
          isActive: true,
          isFirstLogin: false,
        },
        include: {
          role: true,
        },
      });
      console.log(`✅ User created successfully`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role.name}`);
      console.log(`   Organization ID: ${newUser.organizationId}`);
      console.log(`   Is Active: ${newUser.isActive}`);
      console.log(`   Password: Securely hashed (bcrypt)\n`);

      // Create employee profile
      console.log('Step 6: Creating employee profile...');
      const newEmployee = await prisma.employee.create({
        data: {
          employeeId: `FCS-SA-${Date.now()}`,
          userId: newUser.id,
          organizationId: defaultOrg.id,
          firstName: SUPERADMIN_FIRSTNAME,
          lastName: SUPERADMIN_LASTNAME,
          onboardingStatus: 'VERIFIED',
        },
      });
      console.log(`✅ Employee profile created: ${newEmployee.employeeId}\n`);

      // Create notification preferences
      console.log('Step 7: Creating notification preferences...');
      await prisma.notificationPreference.create({
        data: {
          userId: newUser.id,
          email: true,
          inApp: true,
          push: true,
        },
      });
      console.log(`✅ Notification preferences created\n`);
    }

    // Step 8: Verify the setup
    console.log('========================================');
    console.log('VERIFICATION');
    console.log('========================================\n');

    const verifyUser = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL },
      include: {
        role: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            organizationId: true,
          },
        },
      },
    });

    if (!verifyUser) {
      throw new Error('Verification failed: User not found after setup');
    }

    console.log('✅ Super Admin account configured successfully!\n');
    console.log('Account Details:');
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   Role: ${verifyUser.role.name} (${verifyUser.role.displayName})`);
    console.log(`   Organization ID: ${verifyUser.organizationId}`);
    console.log(`   Employee ID: ${verifyUser.employee?.employeeId || 'N/A'}`);
    console.log(`   Name: ${verifyUser.employee?.firstName} ${verifyUser.employee?.lastName}`);
    console.log(`   Is Active: ${verifyUser.isActive}`);
    console.log(`   Password: Securely hashed with bcrypt ✅\n`);

    // Test password verification
    console.log('Testing password verification...');
    const isPasswordCorrect = await bcrypt.compare(SUPERADMIN_PASSWORD, verifyUser.password);
    console.log(`   Password verification: ${isPasswordCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

    if (!isPasswordCorrect) {
      throw new Error('Password verification failed');
    }

    // Final login instructions
    console.log('========================================');
    console.log('LOGIN INSTRUCTIONS');
    console.log('========================================\n');
    console.log('You can now log in using:');
    console.log(`   Email: ${SUPERADMIN_EMAIL}`);
    console.log(`   Password: ${SUPERADMIN_PASSWORD}`);
    console.log('   Redirect: /super-admin\n');
    console.log('The authentication system will:');
    console.log('   1. Verify credentials using bcrypt');
    console.log('   2. Generate JWT token with userId, role, organizationId');
    console.log('   3. Return user profile (NO password in response)');
    console.log('   4. Redirect to /super-admin on successful login\n');
    console.log('========================================');
    console.log('SETUP COMPLETE ✅');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

async function main() {
  try {
    await setupProductionSuperAdmin();
  } catch (error: any) {
    console.error('FATAL ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
