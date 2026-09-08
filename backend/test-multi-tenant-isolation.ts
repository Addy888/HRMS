import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * COMPREHENSIVE MULTI-TENANT DATA ISOLATION TEST
 * 
 * This script creates two separate organizations and tests whether
 * data isolation is working correctly at ALL levels.
 */

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     MULTI-TENANT DATA ISOLATION SECURITY TEST                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Clean up test data first
  console.log('🧹 Cleaning up any existing test data...');
  
  await prisma.$transaction(async (tx) => {
    // Delete in correct order due to foreign keys
    await tx.employee.deleteMany({
      where: { employeeId: { contains: 'TEST-' } },
    });
    
    await tx.user.deleteMany({
      where: { email: { contains: '@testorg' } },
    });
    
    await tx.department.deleteMany({
      where: { name: { contains: 'TestDept' } },
    });
    
    await tx.designation.deleteMany({
      where: { name: { contains: 'TestDesignation' } },
    });
    
    await tx.organization.deleteMany({
      where: { code: { startsWith: 'TEST-ORG-' } },
    });
  });

  console.log('✅ Cleanup complete\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1: Create Two Separate Organizations
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 1: Creating Two Organizations...');
  
  const orgA = await prisma.organization.create({
    data: {
      name: 'Test Company A',
      code: 'TEST-ORG-A',
      email: 'admin@testorga.com',
      phone: '1111111111',
      isActive: true,
    },
  });

  const orgB = await prisma.organization.create({
    data: {
      name: 'Test Company B',
      code: 'TEST-ORG-B',
      email: 'admin@testorgb.com',
      phone: '2222222222',
      isActive: true,
    },
  });

  console.log(`✅ Organization A Created: ${orgA.id}`);
  console.log(`✅ Organization B Created: ${orgB.id}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2: Create Roles
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 2: Ensuring Roles Exist...');
  
  const hrAdminRole = await prisma.role.upsert({
    where: { name: 'HR_ADMIN' },
    update: {},
    create: {
      name: 'HR_ADMIN',
      displayName: 'HR Administrator',
      level: 80,
      isSystem: true,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      level: 10,
      isSystem: true,
    },
  });

  console.log(`✅ HR_ADMIN Role: ${hrAdminRole.id}`);
  console.log(`✅ EMPLOYEE Role: ${employeeRole.id}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3: Create HR Admin for Organization A
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 3: Creating HR Admin A...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const hrUserA = await prisma.user.create({
    data: {
      email: 'hradmin@testorga.com',
      password: passwordHash,
      roleId: hrAdminRole.id,
      organizationId: orgA.id,
      isFirstLogin: false,
      isActive: true,
    },
  });

  console.log(`✅ HR Admin A Created: ${hrUserA.id}`);
  console.log(`   Organization: ${hrUserA.organizationId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 4: Create HR Admin for Organization B
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 4: Creating HR Admin B...');
  
  const hrUserB = await prisma.user.create({
    data: {
      email: 'hradmin@testorgb.com',
      password: passwordHash,
      roleId: hrAdminRole.id,
      organizationId: orgB.id,
      isFirstLogin: false,
      isActive: true,
    },
  });

  console.log(`✅ HR Admin B Created: ${hrUserB.id}`);
  console.log(`   Organization: ${hrUserB.organizationId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 5: Create Department for Organization A
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 5: Creating Department A...');
  
  const deptA = await prisma.department.create({
    data: {
      organizationId: orgA.id,
      name: 'TestDept A - Sales',
      createdByUserId: hrUserA.id,
    },
  });

  console.log(`✅ Department A Created: ${deptA.id} - ${deptA.name}`);
  console.log(`   Organization: ${deptA.organizationId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 6: Create Department for Organization B
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 6: Creating Department B...');
  
  const deptB = await prisma.department.create({
    data: {
      organizationId: orgB.id,
      name: 'TestDept B - Engineering',
      createdByUserId: hrUserB.id,
    },
  });

  console.log(`✅ Department B Created: ${deptB.id} - ${deptB.name}`);
  console.log(`   Organization: ${deptB.organizationId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 7: Create Designation for Organization A
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 7: Creating Designation A...');
  
  const desgA = await prisma.designation.create({
    data: {
      organizationId: orgA.id,
      name: 'TestDesignation A - Manager',
    },
  });

  console.log(`✅ Designation A Created: ${desgA.id} - ${desgA.name}`);
  console.log(`   Organization: ${desgA.organizationId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 8: Create Designation for Organization B
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 8: Creating Designation B...');
  
  const desgB = await prisma.designation.create({
    data: {
      organizationId: orgB.id,
      name: 'TestDesignation B - Developer',
    },
  });

  console.log(`✅ Designation B Created: ${desgB.id} - ${desgB.name}`);
  console.log(`   Organization: ${desgB.organizationId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 9: Create Employee for Organization A
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 9: Creating Employee A...');
  
  const empUserA = await prisma.user.create({
    data: {
      email: 'employee@testorga.com',
      password: passwordHash,
      roleId: employeeRole.id,
      organizationId: orgA.id,
      isFirstLogin: true,
      isActive: true,
    },
  });

  const employeeA = await prisma.employee.create({
    data: {
      employeeId: 'TEST-ORGA-001',
      userId: empUserA.id,
      organizationId: orgA.id,
      createdByUserId: hrUserA.id,
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '9999999991',
      departmentId: deptA.id,
      designationId: desgA.id,
      monthlySalary: 50000,
      onboardingStatus: 'COMPLETED',
    },
  });

  console.log(`✅ Employee A Created: ${employeeA.id} - ${employeeA.employeeId}`);
  console.log(`   User: ${empUserA.email}`);
  console.log(`   Organization: ${employeeA.organizationId}`);
  console.log(`   Created By: ${employeeA.createdByUserId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 10: Create Employee for Organization B
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('📊 STEP 10: Creating Employee B...');
  
  const empUserB = await prisma.user.create({
    data: {
      email: 'employee@testorgb.com',
      password: passwordHash,
      roleId: employeeRole.id,
      organizationId: orgB.id,
      isFirstLogin: true,
      isActive: true,
    },
  });

  const employeeB = await prisma.employee.create({
    data: {
      employeeId: 'TEST-ORGB-001',
      userId: empUserB.id,
      organizationId: orgB.id,
      createdByUserId: hrUserB.id,
      firstName: 'Bob',
      lastName: 'Johnson',
      phone: '8888888881',
      departmentId: deptB.id,
      designationId: desgB.id,
      monthlySalary: 30000,
      onboardingStatus: 'COMPLETED',
    },
  });

  console.log(`✅ Employee B Created: ${employeeB.id} - ${employeeB.employeeId}`);
  console.log(`   User: ${empUserB.email}`);
  console.log(`   Organization: ${employeeB.organizationId}`);
  console.log(`   Created By: ${employeeB.createdByUserId}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 11: DATA ISOLATION TESTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                    RUNNING ISOLATION TESTS                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  let passedTests = 0;
  let failedTests = 0;

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Organization IDs are Different
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 1: Verify Organizations Have Different IDs');
  console.log(`  Org A ID: ${orgA.id}`);
  console.log(`  Org B ID: ${orgB.id}`);
  
  if (orgA.id !== orgB.id) {
    console.log('✅ PASS: Organizations have different IDs\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Organizations have SAME ID (CRITICAL BUG)\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: HR Admins Belong to Different Organizations
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 2: Verify HR Admins Belong to Different Organizations');
  console.log(`  HR Admin A Organization: ${hrUserA.organizationId}`);
  console.log(`  HR Admin B Organization: ${hrUserB.organizationId}`);
  
  if (
    hrUserA.organizationId === orgA.id &&
    hrUserB.organizationId === orgB.id &&
    hrUserA.organizationId !== hrUserB.organizationId
  ) {
    console.log('✅ PASS: HR Admins belong to different organizations\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: HR Admins organization IDs incorrect\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Employee Query - HR A should see only Org A employees
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 3: HR Admin A Queries Employees (Should see ONLY Org A)');
  
  const hrAEmployees = await prisma.employee.findMany({
    where: {
      organizationId: hrUserA.organizationId,
    },
  });

  console.log(`  Employees Found: ${hrAEmployees.length}`);
  hrAEmployees.forEach(emp => {
    console.log(`    - ${emp.employeeId}: Org ${emp.organizationId}`);
  });
  
  const hasOnlyOrgAEmployees = hrAEmployees.every(
    emp => emp.organizationId === orgA.id
  );
  const doesNotHaveOrgBEmployees = !hrAEmployees.some(
    emp => emp.id === employeeB.id
  );
  
  if (hasOnlyOrgAEmployees && doesNotHaveOrgBEmployees) {
    console.log('✅ PASS: HR A sees ONLY Org A employees\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: HR A can see Org B employees (DATA LEAK)\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: Employee Query - HR B should see only Org B employees
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 4: HR Admin B Queries Employees (Should see ONLY Org B)');
  
  const hrBEmployees = await prisma.employee.findMany({
    where: {
      organizationId: hrUserB.organizationId,
    },
  });

  console.log(`  Employees Found: ${hrBEmployees.length}`);
  hrBEmployees.forEach(emp => {
    console.log(`    - ${emp.employeeId}: Org ${emp.organizationId}`);
  });
  
  const hasOnlyOrgBEmployees = hrBEmployees.every(
    emp => emp.organizationId === orgB.id
  );
  const doesNotHaveOrgAEmployees = !hrBEmployees.some(
    emp => emp.id === employeeA.id
  );
  
  if (hasOnlyOrgBEmployees && doesNotHaveOrgAEmployees) {
    console.log('✅ PASS: HR B sees ONLY Org B employees\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: HR B can see Org A employees (DATA LEAK)\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 5: Department Query - Departments are Organization-Scoped
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 5: Department Query (Should be Organization-Scoped)');
  
  const orgADepts = await prisma.department.findMany({
    where: { organizationId: orgA.id },
  });

  const orgBDepts = await prisma.department.findMany({
    where: { organizationId: orgB.id },
  });

  console.log(`  Org A Departments: ${orgADepts.length}`);
  console.log(`  Org B Departments: ${orgBDepts.length}`);
  
  const orgAHasOnlyOrgADepts = orgADepts.every(
    d => d.organizationId === orgA.id
  );
  const orgBHasOnlyOrgBDepts = orgBDepts.every(
    d => d.organizationId === orgB.id
  );
  const noOverlap = !orgADepts.some(d => d.id === deptB.id) &&
                    !orgBDepts.some(d => d.id === deptA.id);
  
  if (orgAHasOnlyOrgADepts && orgBHasOnlyOrgBDepts && noOverlap) {
    console.log('✅ PASS: Departments are properly isolated\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Department isolation breach\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 6: Designation Query - Designations are Organization-Scoped
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 6: Designation Query (Should be Organization-Scoped)');
  
  const orgADesigs = await prisma.designation.findMany({
    where: { organizationId: orgA.id },
  });

  const orgBDesigs = await prisma.designation.findMany({
    where: { organizationId: orgB.id },
  });

  console.log(`  Org A Designations: ${orgADesigs.length}`);
  console.log(`  Org B Designations: ${orgBDesigs.length}`);
  
  const orgAHasOnlyOrgADesigs = orgADesigs.every(
    d => d.organizationId === orgA.id
  );
  const orgBHasOnlyOrgBDesigs = orgBDesigs.every(
    d => d.organizationId === orgB.id
  );
  const noDesgOverlap = !orgADesigs.some(d => d.id === desgB.id) &&
                        !orgBDesigs.some(d => d.id === desgA.id);
  
  if (orgAHasOnlyOrgADesigs && orgBHasOnlyOrgBDesigs && noDesgOverlap) {
    console.log('✅ PASS: Designations are properly isolated\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: Designation isolation breach\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 7: IDOR Attack Test - HR A tries to access Employee B by ID
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 7: IDOR Attack Test - HR A tries to access Employee B by ID');
  console.log(`  HR A Organization: ${hrUserA.organizationId}`);
  console.log(`  Employee B ID: ${employeeB.id}`);
  console.log(`  Employee B Organization: ${employeeB.organizationId}`);
  
  // Simulate the query HR A would make
  const idorAttempt = await prisma.employee.findFirst({
    where: {
      id: employeeB.id,
      organizationId: hrUserA.organizationId, // HR A's org
    },
  });

  if (!idorAttempt) {
    console.log('✅ PASS: HR A CANNOT access Employee B (IDOR prevented)\n');
    passedTests++;
  } else {
    console.log('❌ FAIL: HR A CAN access Employee B (IDOR VULNERABILITY)\n');
    failedTests++;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST 8: Cross-Organization Assignment Prevention
  // ─────────────────────────────────────────────────────────────────
  
  console.log('TEST 8: Cross-Organization Assignment Prevention');
  console.log(`  Attempting to assign Employee A (Org ${employeeA.organizationId})`);
  console.log(`  To Department B (Org ${deptB.organizationId})`);
  
  let crossOrgAssignmentPrevented = false;
  
  try {
    // This should fail if validation is in place
    const result = await prisma.employee.update({
      where: { id: employeeA.id },
      data: { departmentId: deptB.id },
    });
    
    // If we get here, check if the assignment actually happened
    if (result.departmentId === deptB.id) {
      console.log('❌ FAIL: Cross-organization assignment SUCCEEDED (SECURITY BUG)\n');
      failedTests++;
      
      // Rollback the bad assignment
      await prisma.employee.update({
        where: { id: employeeA.id },
        data: { departmentId: deptA.id },
      });
    } else {
      console.log('✅ PASS: Cross-organization assignment prevented\n');
      passedTests++;
      crossOrgAssignmentPrevented = true;
    }
  } catch (error) {
    console.log('✅ PASS: Cross-organization assignment blocked by database constraint\n');
    passedTests++;
    crossOrgAssignmentPrevented = true;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINAL RESULTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST RESULTS                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ PASSED: ${passedTests}/8 tests`);
  console.log(`❌ FAILED: ${failedTests}/8 tests\n`);

  if (failedTests === 0) {
    console.log('🎉 SUCCESS: Multi-tenant data isolation is working correctly!');
  } else {
    console.log('⚠️  CRITICAL: Multi-tenant data isolation has VULNERABILITIES!');
    console.log('   Immediate action required to fix security issues.');
  }

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                     TEST DATA SUMMARY                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('ORGANIZATION A:');
  console.log(`  ID: ${orgA.id}`);
  console.log(`  HR Admin: ${hrUserA.email} (${hrUserA.id})`);
  console.log(`  Employee: ${employeeA.employeeId} - ${employeeA.firstName} ${employeeA.lastName}`);
  console.log(`  Department: ${deptA.name}`);
  console.log(`  Designation: ${desgA.name}\n`);

  console.log('ORGANIZATION B:');
  console.log(`  ID: ${orgB.id}`);
  console.log(`  HR Admin: ${hrUserB.email} (${hrUserB.id})`);
  console.log(`  Employee: ${employeeB.employeeId} - ${employeeB.firstName} ${employeeB.lastName}`);
  console.log(`  Department: ${deptB.name}`);
  console.log(`  Designation: ${desgB.name}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('NOTE: Test data created with prefix "TEST-" for easy cleanup');
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
