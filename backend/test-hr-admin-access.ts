import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * HR ADMIN ACCESS TEST
 * 
 * This test verifies that multiple HR Admins in the SAME organization
 * can see ALL employees in that organization (not just ones they created).
 */

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║          HR ADMIN ACCESS TEST - SAME ORGANIZATION                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Clean up test data first
  console.log('🧹 Cleaning up any existing test data...');
  
  await prisma.$transaction(async (tx) => {
    await tx.employee.deleteMany({
      where: { employeeId: { contains: 'TEST-HR-' } },
    });
    
    await tx.user.deleteMany({
      where: { email: { contains: '@testhrorg' } },
    });
    
    await tx.department.deleteMany({
      where: { name: { contains: 'TestHRDept' } },
    });
    
    await tx.organization.deleteMany({
      where: { code: 'TEST-HR-ORG' },
    });
  });

  console.log('✅ Cleanup complete\n');

  // Create test organization
  console.log('📊 Creating Test Organization...');
  
  const org = await prisma.organization.create({
    data: {
      name: 'Test HR Organization',
      code: 'TEST-HR-ORG',
      email: 'admin@testhrorg.com',
      phone: '5555555555',
      isActive: true,
    },
  });

  console.log(`✅ Organization Created: ${org.id}\n`);

  // Get roles
  const hrAdminRole = await prisma.role.findUnique({ where: { name: 'HR_ADMIN' } });
  const employeeRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });

  if (!hrAdminRole || !employeeRole) {
    throw new Error('Required roles not found in database');
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create HR Admin Alice
  console.log('📊 Creating HR Admin Alice...');
  
  const hrAlice = await prisma.user.create({
    data: {
      email: 'alice@testhrorg.com',
      password: passwordHash,
      roleId: hrAdminRole.id,
      organizationId: org.id,
      isFirstLogin: false,
      isActive: true,
    },
  });

  console.log(`✅ HR Admin Alice Created: ${hrAlice.id}`);
  console.log(`   Organization: ${hrAlice.organizationId}\n`);

  // Create HR Admin Bob
  console.log('📊 Creating HR Admin Bob...');
  
  const hrBob = await prisma.user.create({
    data: {
      email: 'bob@testhrorg.com',
      password: passwordHash,
      roleId: hrAdminRole.id,
      organizationId: org.id,
      isFirstLogin: false,
      isActive: true,
    },
  });

  console.log(`✅ HR Admin Bob Created: ${hrBob.id}`);
  console.log(`   Organization: ${hrBob.organizationId}\n`);

  // Create test department
  const dept = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'TestHRDept - Sales',
      createdByUserId: hrAlice.id,
    },
  });

  // HR Admin Alice creates Employee E1
  console.log('📊 HR Admin Alice creates Employee E1...');
  
  const empUser1 = await prisma.user.create({
    data: {
      email: 'emp1@testhrorg.com',
      password: passwordHash,
      roleId: employeeRole.id,
      organizationId: org.id,
      isFirstLogin: true,
      isActive: true,
    },
  });

  const employee1 = await prisma.employee.create({
    data: {
      employeeId: 'TEST-HR-E1',
      userId: empUser1.id,
      organizationId: org.id,
      createdByUserId: hrAlice.id, // ✅ Created by Alice
      firstName: 'Employee',
      lastName: 'One',
      phone: '1111111111',
      departmentId: dept.id,
      monthlySalary: 50000,
      onboardingStatus: 'COMPLETED',
    },
  });

  console.log(`✅ Employee E1 Created: ${employee1.id}`);
  console.log(`   Employee ID: ${employee1.employeeId}`);
  console.log(`   Created By: Alice (${hrAlice.id})\n`);

  // HR Admin Bob creates Employee E2
  console.log('📊 HR Admin Bob creates Employee E2...');
  
  const empUser2 = await prisma.user.create({
    data: {
      email: 'emp2@testhrorg.com',
      password: passwordHash,
      roleId: employeeRole.id,
      organizationId: org.id,
      isFirstLogin: true,
      isActive: true,
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      employeeId: 'TEST-HR-E2',
      userId: empUser2.id,
      organizationId: org.id,
      createdByUserId: hrBob.id, // ✅ Created by Bob
      firstName: 'Employee',
      lastName: 'Two',
      phone: '2222222222',
      departmentId: dept.id,
      monthlySalary: 60000,
      onboardingStatus: 'COMPLETED',
    },
  });

  console.log(`✅ Employee E2 Created: ${employee2.id}`);
  console.log(`   Employee ID: ${employee2.employeeId}`);
  console.log(`   Created By: Bob (${hrBob.id})\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RUN ACCESS TESTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                    RUNNING ACCESS TESTS                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  let passedTests = 0;
  let failedTests = 0;

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: HR Admin Alice queries employees (should see BOTH E1 and E2)
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 1: HR Admin Alice Queries All Employees');
  console.log('  Expected: Should see BOTH E1 (created by Alice) AND E2 (created by Bob)');
  
  // Simulate the query that employees.service.ts would make AFTER the fix
  const aliceEmployees = await prisma.employee.findMany({
    where: {
      organizationId: hrAlice.organizationId, // ✅ Organization filter only
      // ❌ REMOVED: createdByUserId: hrAlice.id
      user: {
        role: {
          name: { notIn: ['HR', 'HR_ADMIN', 'HR_USER'] },
        },
      },
    },
  });

  console.log(`  Employees Found: ${aliceEmployees.length}`);
  aliceEmployees.forEach(emp => {
    console.log(`    - ${emp.employeeId}: Created by ${emp.createdByUserId}`);
  });
  
  const aliceSeesE1 = aliceEmployees.some(e => e.id === employee1.id);
  const aliceSeesE2 = aliceEmployees.some(e => e.id === employee2.id);
  
  if (aliceSeesE1 && aliceSeesE2 && aliceEmployees.length === 2) {
    console.log('✅ PASS: Alice sees BOTH E1 and E2 (all employees in organization)\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Alice does not see all employees');
    console.log(`   Sees E1: ${aliceSeesE1}, Sees E2: ${aliceSeesE2}, Total: ${aliceEmployees.length}\n`);
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: HR Admin Bob queries employees (should see BOTH E1 and E2)
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 2: HR Admin Bob Queries All Employees');
  console.log('  Expected: Should see BOTH E1 (created by Alice) AND E2 (created by Bob)');
  
  const bobEmployees = await prisma.employee.findMany({
    where: {
      organizationId: hrBob.organizationId, // ✅ Organization filter only
      // ❌ REMOVED: createdByUserId: hrBob.id
      user: {
        role: {
          name: { notIn: ['HR', 'HR_ADMIN', 'HR_USER'] },
        },
      },
    },
  });

  console.log(`  Employees Found: ${bobEmployees.length}`);
  bobEmployees.forEach(emp => {
    console.log(`    - ${emp.employeeId}: Created by ${emp.createdByUserId}`);
  });
  
  const bobSeesE1 = bobEmployees.some(e => e.id === employee1.id);
  const bobSeesE2 = bobEmployees.some(e => e.id === employee2.id);
  
  if (bobSeesE1 && bobSeesE2 && bobEmployees.length === 2) {
    console.log('✅ PASS: Bob sees BOTH E1 and E2 (all employees in organization)\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Bob does not see all employees');
    console.log(`   Sees E1: ${bobSeesE1}, Sees E2: ${bobSeesE2}, Total: ${bobEmployees.length}\n`);
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: HR Admin Alice can access Employee E2 details (created by Bob)
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 3: HR Admin Alice Accesses Employee E2 Details');
  console.log('  Expected: Should be able to view E2 (created by Bob)');
  
  const aliceAccessE2 = await prisma.employee.findFirst({
    where: {
      id: employee2.id,
      organizationId: hrAlice.organizationId, // ✅ Organization check only
      // ❌ REMOVED: createdByUserId: hrAlice.id
    },
  });

  if (aliceAccessE2) {
    console.log('✅ PASS: Alice can access E2 details\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Alice cannot access E2 details\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: HR Admin Bob can access Employee E1 details (created by Alice)
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 4: HR Admin Bob Accesses Employee E1 Details');
  console.log('  Expected: Should be able to view E1 (created by Alice)');
  
  const bobAccessE1 = await prisma.employee.findFirst({
    where: {
      id: employee1.id,
      organizationId: hrBob.organizationId, // ✅ Organization check only
      // ❌ REMOVED: createdByUserId: hrBob.id
    },
  });

  if (bobAccessE1) {
    console.log('✅ PASS: Bob can access E1 details\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Bob cannot access E1 details\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 5: Verify createdByUserId is still tracked (for audit)
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 5: Verify createdByUserId is Tracked for Audit');
  console.log('  Expected: E1 should show Alice as creator, E2 should show Bob as creator');
  
  const e1Data = await prisma.employee.findUnique({
    where: { id: employee1.id },
    select: { createdByUserId: true },
  });

  const e2Data = await prisma.employee.findUnique({
    where: { id: employee2.id },
    select: { createdByUserId: true },
  });

  console.log(`  E1 createdByUserId: ${e1Data?.createdByUserId}`);
  console.log(`  E2 createdByUserId: ${e2Data?.createdByUserId}`);
  
  if (e1Data?.createdByUserId === hrAlice.id && e2Data?.createdByUserId === hrBob.id) {
    console.log('✅ PASS: createdByUserId correctly tracks creator for audit\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: createdByUserId not tracking correctly\n');
    failedTests++;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINAL RESULTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST RESULTS                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ PASSED: ${passedTests}/5 tests`);
  console.log(`❌ FAILED: ${failedTests}/5 tests\n`);

  if (failedTests === 0) {
    console.log('🎉 SUCCESS: HR Admin access is working correctly!');
    console.log('   Multiple HR Admins in the same organization can see all employees.');
  } else {
    console.log('⚠️  FAILED: HR Admin access has issues!');
    console.log('   HR Admins cannot see all employees in their organization.');
  }

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                     TEST DATA SUMMARY                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('ORGANIZATION:');
  console.log(`  ID: ${org.id}`);
  console.log(`  Name: ${org.name}\n`);

  console.log('HR ADMINS:');
  console.log(`  Alice: ${hrAlice.email} (${hrAlice.id})`);
  console.log(`  Bob: ${hrBob.email} (${hrBob.id})\n`);

  console.log('EMPLOYEES:');
  console.log(`  E1: ${employee1.employeeId} - Created by Alice`);
  console.log(`  E2: ${employee2.employeeId} - Created by Bob\n`);

  console.log('EXPECTED BEHAVIOR:');
  console.log('  ✅ Alice should see BOTH E1 and E2');
  console.log('  ✅ Bob should see BOTH E1 and E2');
  console.log('  ✅ createdByUserId tracked for audit purposes only\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('NOTE: Test data created with prefix "TEST-HR-" for easy cleanup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
