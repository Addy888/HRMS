/**
 * Check current database state - users, organizations, roles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking Database State...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check Organizations
    console.log('📊 ORGANIZATIONS:');
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, code: true, email: true, isActive: true },
    });
    console.log(`Found ${orgs.length} organizations:`);
    orgs.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.name} (${org.code})`);
      console.log(`     ID: ${org.id}`);
      console.log(`     Email: ${org.email}`);
      console.log(`     Active: ${org.isActive}`);
    });

    // Check Roles
    console.log('\n📊 ROLES:');
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, level: true, isActive: true },
    });
    console.log(`Found ${roles.length} roles:`);
    roles.forEach((role, idx) => {
      console.log(`  ${idx + 1}. ${role.name} (Level: ${role.level}, Active: ${role.isActive})`);
    });

    // Check Users
    console.log('\n📊 USERS:');
    const users = await prisma.user.findMany({
      include: {
        role: { select: { name: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found ${users.length} users:`);
    users.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.email}`);
      console.log(`     Role: ${user.role.name}`);
      console.log(`     Organization: ${user.organization.name}`);
      console.log(`     Active: ${user.isActive}`);
      console.log(`     First Login: ${user.isFirstLogin}`);
      console.log(`     User ID: ${user.id}`);
      console.log(`     Org ID: ${user.organizationId}`);
    });

    // Check Employees
    console.log('\n📊 EMPLOYEES:');
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { email: true, role: { select: { name: true } } } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found ${employees.length} employees:`);
    employees.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
      console.log(`     Email: ${emp.user.email}`);
      console.log(`     Role: ${emp.user.role.name}`);
      console.log(`     Organization: ${emp.organization.name}`);
      console.log(`     Org ID: ${emp.organizationId}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database state check complete\n');

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
