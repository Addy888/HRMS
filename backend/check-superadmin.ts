/**
 * Check superadmin@fcs.com account
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking superadmin@fcs.com...\n');

    const email = 'superadmin@fcs.com';
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        organization: true,
      },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND: superadmin@fcs.com');
      console.log('\nSearching for similar users...');
      
      const allUsers = await prisma.user.findMany({
        include: { role: true },
      });
      
      console.log(`\nFound ${allUsers.length} total users:`);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role.name})`);
      });
      
      return;
    }

    console.log('✅ USER FOUND');
    console.log('   Email:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Role:', user.role.name);
    console.log('   Is Active:', user.isActive);
    console.log('   Organization ID:', user.organizationId);
    console.log('   Organization:', user.organization?.name);
    console.log('   Organization Active:', user.organization?.isActive);
    console.log('   Password Hash:', user.password.substring(0, 30) + '...');
    console.log('   Hash Format:', user.password.startsWith('$2b$') || user.password.startsWith('$2a$') ? 'bcrypt' : 'unknown');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
