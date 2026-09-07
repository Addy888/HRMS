/**
 * ✅ SETUP INITIAL ORGANIZATION AND SUPER ADMIN
 * 
 * This script creates the initial organization structure and a working Super Admin account.
 * Run this after database migration to restore access.
 * 
 * Run: npx ts-node setup-initial-organization.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupInitialOrganization() {
  try {
    console.log('🔧 Setting up initial organization and Super Admin...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Create or get default organization
    console.log('Step 1: Creating/checking default organization...');
    let defaultOrg = await prisma.organization.findFirst({
      where: { code: 'ORG-DEFAULT' },
    });

    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'FCS Corporation',
          code: 'ORG-DEFAULT',
          email: 'admin@fcscorp.com',
          phone: '1234567890',
          isActive: true,
        },
      });
      console.log('✅ Default organization created:', defaultOrg.id);
    } else {
      console.log('✅ Default organization exists:', defaultOrg.id);
    }

    // Step 2: Create system roles
    console.log('\nStep 2: Creating/checking system roles...');
    
    const rolesToCreate = [
      { name: 'SUPER_ADMIN', displayName: 'Super Admin', level: 100, isSystem: true },
      { name: 'HR_ADMIN', displayName: 'HR Admin', level: 80, isSystem: true },
      { name: 'HR_USER', displayName: 'HR User', level: 60, isSystem: true },
      { name: 'HR', displayName: 'HR (Legacy)', level: 60, isSystem: true },
      { name: 'EMPLOYEE', displayName: 'Employee', level: 10, isSystem: true },
    ];

    const roles: any = {};
    for (const roleData of rolesToCreate) {
      let role = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleData.name,
            displayName: roleData.displayName,
            description: `${roleData.displayName} role`,
            level: roleData.level,
            isSystem: roleData.isSystem,
            isActive: true,
          },
        });
        console.log(`✅ Role created: ${roleData.name}`);
      } else {
        console.log(`✅ Role exists: ${roleData.name}`);
      }
      roles[roleData.name] = role;
    }

    // Step 3: Create Super Admin account
    console.log('\nStep 3: Creating Super Admin account...');
    const superAdminEmail = 'adityashastri76@gmail.com';
    const superAdminPassword = '12345678';

    let superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
      include: { role: true },
    });

    let superAdminId: string;

    if (superAdmin) {
      console.log('ℹ️  Super Admin user already exists');
      console.log('   Email:', superAdmin.email);
      console.log('   Role:', superAdmin.role.name);
      console.log('   Organization:', superAdmin.organizationId);
      console.log('   Active:', superAdmin.isActive);
      
      if (!superAdmin.isActive) {
        console.log('⚠️  Account is inactive. Activating...');
        await prisma.user.update({
          where: { id: superAdmin.id },
          data: { isActive: true },
        });
        console.log('✅ Account activated');
      }
      superAdminId = superAdmin.id;
    } else {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
      
      const newSuperAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          roleId: roles.SUPER_ADMIN.id,
          organizationId: defaultOrg.id,
          isFirstLogin: false,
          isActive: true,
        },
      });
      
      superAdminId = newSuperAdmin.id;
      
      console.log('✅ Super Admin user created');
      console.log('   Email:', superAdminEmail);
      console.log('   Password:', superAdminPassword);
      console.log('   Organization:', defaultOrg.name);
    }

    // Step 4: Create employee profile for Super Admin (if not exists)
    console.log('\nStep 4: Creating Super Admin employee profile...');
    const existingProfile = await prisma.employee.findFirst({
      where: { userId: superAdminId },
    });

    if (!existingProfile) {
      await prisma.employee.create({
        data: {
          employeeId: `SA-${Date.now()}`,
          userId: superAdminId,
          organizationId: defaultOrg.id,
          firstName: 'Aditya',
          lastName: 'Shastri',
          phone: '9876543210',
          joiningDate: new Date(),
          onboardingStatus: 'VERIFIED',
        },
      });
      console.log('✅ Employee profile created');
    } else {
      console.log('✅ Employee profile exists');
    }

    // Step 5: Create default department
    console.log('\nStep 5: Creating default department...');
    let adminDept = await prisma.department.findFirst({
      where: {
        organizationId: defaultOrg.id,
        name: 'Administration',
      },
    });

    if (!adminDept) {
      adminDept = await prisma.department.create({
        data: {
          organizationId: defaultOrg.id,
          name: 'Administration',
          code: 'ADMIN',
          description: 'Administration & Management',
          isActive: true,
        },
      });
      console.log('✅ Administration department created');
    } else {
      console.log('✅ Administration department exists');
    }

    // Step 6: Create default EMPLOYEE designations (NOT system roles)
    console.log('\nStep 6: Creating default employee designations...');
    
    const employeeDesignations = [
      { name: 'Manager', description: 'Department Manager' },
      { name: 'Team Leader', description: 'Team Leader' },
      { name: 'Senior Executive', description: 'Senior Executive' },
      { name: 'Executive', description: 'Executive' },
    ];

    for (const desg of employeeDesignations) {
      const existing = await prisma.designation.findFirst({
        where: {
          organizationId: defaultOrg.id,
          name: desg.name,
        },
      });

      if (!existing) {
        await prisma.designation.create({
          data: {
            organizationId: defaultOrg.id,
            name: desg.name,
            description: desg.description,
          },
        });
        console.log(`✅ Designation created: ${desg.name}`);
      } else {
        console.log(`✅ Designation exists: ${desg.name}`);
      }
    }

    // Step 7: Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Email:', superAdminEmail);
    console.log('   Password:', superAdminPassword);
    console.log('   Organization:', defaultOrg.name);
    console.log('   Dashboard: /super-admin');
    console.log('\n✅ You can now login to the system!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupInitialOrganization()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
