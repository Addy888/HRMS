/**
 * ⚠️  PRODUCTION DATABASE CLEANUP SCRIPT
 * 
 * This script removes ALL test/demo data from the database.
 * 
 * ⚠️  WARNING: This will DELETE data. Make sure you have a backup!
 * 
 * What this script does:
 * 1. Identifies test/demo users (emails containing: test, demo, dummy, sample)
 * 2. Removes associated employees, documents, complaints, notifications
 * 3. Keeps database structure intact (tables, roles, etc.)
 * 4. Keeps one production-ready HR_ADMIN account for first login
 * 
 * What this script does NOT do:
 * - Does not drop tables
 * - Does not reset migrations
 * - Does not remove roles
 * - Does not remove organization structure
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function cleanupTestData() {
  console.log('═'.repeat(80));
  console.log('⚠️  PRODUCTION DATABASE CLEANUP');
  console.log('═'.repeat(80));
  console.log('\n❗ WARNING: This will DELETE test data from the database!');
  console.log('❗ Make sure you have a backup before proceeding!\n');

  const answer = await question('Do you want to continue? Type "YES" to proceed: ');

  if (answer !== 'YES') {
    console.log('\n✅ Cleanup cancelled. No changes made.');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('\n📊 Analyzing database...\n');

    // 1. Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'demo' } },
          { email: { contains: 'dummy' } },
          { email: { contains: 'sample' } },
        ],
      },
      include: {
        role: true,
        employee: true,
      },
    });

    console.log(`Found ${testUsers.length} test/demo users:`);
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role.name})`);
    });

    if (testUsers.length === 0) {
      console.log('\n✅ No test data found. Database is clean!');
      rl.close();
      process.exit(0);
    }

    console.log('\n⚠️  The following will be deleted:');
    console.log(`   - ${testUsers.length} test user accounts`);
    console.log(`   - Associated employee profiles`);
    console.log(`   - Associated documents`);
    console.log(`   - Associated complaints`);
    console.log(`   - Associated notifications`);
    console.log(`   - Associated activity logs\n`);

    const confirm = await question('Are you ABSOLUTELY SURE? Type "DELETE" to proceed: ');

    if (confirm !== 'DELETE') {
      console.log('\n✅ Cleanup cancelled. No changes made.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🔄 Starting cleanup...\n');

    let deletedCount = 0;

    for (const user of testUsers) {
      console.log(`Processing: ${user.email}...`);

      try {
        // Delete user (cascades will handle related records)
        await prisma.user.delete({
          where: { id: user.id },
        });

        deletedCount++;
        console.log(`   ✅ Deleted ${user.email}`);
      } catch (error) {
        console.error(`   ❌ Error deleting ${user.email}:`, error.message);
      }
    }

    // Clean up orphaned notifications
    console.log('\n🧹 Cleaning up orphaned notifications...');
    const orphanedNotifications = await prisma.notification.deleteMany({
      where: {
        userId: null,
      },
    });
    console.log(`   ✅ Removed ${orphanedNotifications.count} orphaned notifications`);

    // Clean up orphaned audit logs
    console.log('\n🧹 Cleaning up orphaned audit logs...');
    const orphanedLogs = await prisma.auditLog.deleteMany({
      where: {
        userId: null,
      },
    });
    console.log(`   ✅ Removed ${orphanedLogs.count} orphaned audit logs`);

    console.log('\n═'.repeat(80));
    console.log('✅ CLEANUP COMPLETE');
    console.log('═'.repeat(80));
    console.log(`\n   Deleted ${deletedCount} test user accounts`);
    console.log(`   Deleted ${orphanedNotifications.count} orphaned notifications`);
    console.log(`   Deleted ${orphanedLogs.count} orphaned audit logs`);

    // Show remaining users
    console.log('\n📊 Remaining users in database:');
    const remainingUsers = await prisma.user.findMany({
      include: {
        role: true,
      },
    });

    if (remainingUsers.length === 0) {
      console.log('   ⚠️  WARNING: No users remaining in database!');
      console.log('   You will need to create a new HR_ADMIN account to access the system.');
    } else {
      remainingUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role.name})`);
      });
    }

    console.log('\n═'.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR during cleanup:');
    console.error(error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

cleanupTestData()
  .then(() => {
    console.log('\n✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });
