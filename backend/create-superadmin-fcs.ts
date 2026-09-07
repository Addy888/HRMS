/**
 * Create superadmin@fcs.com account
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔧 Creating superadmin@fcs.com...\n');

    const email = 'superadmin@fcs.com';
    const password = 'Admin@123'; // Default Super Admin password
    
    // Check if already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('✅ User already exists:', email);
      return;
    }

    // Get or create organization
    let organization = await prisma.organization.findFirst({
      where: { code: 'ORG-DEFAULT' },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'FCS Corporation',
          code: 'ORG-DEFAULT',
          email: 'admin@fcscorp.com',
          phone: '1234567890',
          isActive: true,
        },
      });
      console.log('✅ Created organization:', organization.name);
    }

    // Get SUPER_ADMIN role
    let superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          displayName: 'Super Administrator',
          description: 'System Super Administrator with full access',
          level: 100,
          isSystem: true,
        },
      });
      console.log('✅ Created SUPER_ADMIN role');
    }

    // Hash password using bcrypt (same as auth service)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId: superAdminRole.id,
        organizationId: organization.id,
        isFirstLogin: false,
        isActive: true,
      },
    });

    console.log('\n✅ SUPER ADMIN CREATED SUCCESSFULLY');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   User ID:', user.id);
    console.log('   Role: SUPER_ADMIN');
    console.log('   Organization:', organization.name);
    console.log('   Active: true');

    console.log('\n🔑 Login Credentials:');
    console.log('   Email: superadmin@fcs.com');
    console.log('   Password: Admin@123');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
