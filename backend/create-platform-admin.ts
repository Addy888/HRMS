/**
 * CREATE PLATFORM SUPER ADMIN
 * 
 * This script creates:
 * 1. PLATFORM_SUPER_ADMIN role
 * 2. A platform super admin user (not tied to any specific organization)
 * 
 * Run: npx ts-node create-platform-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Creating Platform Super Admin...\n');

    // 1. Ensure default organization exists (for platform admin to belong to)
    let platformOrg = await prisma.organization.findUnique({
      where: { code: 'ORG-PLATFORM' },
    });

    if (!platformOrg) {
      console.log('Creating Platform Organization...');
      platformOrg = await prisma.organization.create({
        data: {
          name: 'Platform Administration',
          code: 'ORG-PLATFORM',
          email: 'platform@fcscorp.com',
          phone: '0000000000',
          isActive: true,
        },
      });
      console.log('✅ Platform Organization created\n');
    } else {
      console.log('✅ Platform Organization already exists\n');
    }

    // 2. Create PLATFORM_SUPER_ADMIN role
    let platformRole = await prisma.role.findUnique({
      where: { name: 'PLATFORM_SUPER_ADMIN' },
    });

    if (!platformRole) {
      console.log('Creating PLATFORM_SUPER_ADMIN role...');
      platformRole = await prisma.role.create({
        data: {
          name: 'PLATFORM_SUPER_ADMIN',
          displayName: 'Platform Super Admin',
          description: 'Platform owner who can manage multiple companies',
          level: 200, // Highest level
          isSystem: true,
        },
      });
      console.log('✅ PLATFORM_SUPER_ADMIN role created\n');
    } else {
      console.log('✅ PLATFORM_SUPER_ADMIN role already exists\n');
    }

    // 3. Create platform super admin user
    const platformAdminEmail = 'platform@fcscorp.com';

    const existingUser = await prisma.user.findUnique({
      where: { email: platformAdminEmail },
    });

    if (existingUser) {
      console.log(`✅ Platform Super Admin user already exists: ${platformAdminEmail}`);
      
      // Update role if needed
      if (existingUser.roleId !== platformRole.id) {
        await prisma.user.update({
          where: { email: platformAdminEmail },
          data: { roleId: platformRole.id },
        });
        console.log('✓ User role updated to PLATFORM_SUPER_ADMIN\n');
      }
    } else {
      console.log('Creating Platform Super Admin user...');
      
      const hashedPassword = await bcrypt.hash('Platform@123', 10);
      
      await prisma.user.create({
        data: {
          email: platformAdminEmail,
          password: hashedPassword,
          roleId: platformRole.id,
          organizationId: platformOrg.id,
          isFirstLogin: false,
          isActive: true,
        },
      });

      console.log('✅ Platform Super Admin user created\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('Platform Super Admin Setup Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log('Email:    platform@fcscorp.com');
    console.log('Password: Platform@123');
    console.log('Role:     PLATFORM_SUPER_ADMIN');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nPlatform Super Admin can:');
    console.log('• Create new organizations (companies)');
    console.log('• Create company Super Admins');
    console.log('• Manage organizations');
    console.log('• View platform statistics');
    console.log('• CANNOT access company-specific data\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
