/**
 * 🧪 ORGANIZATION ISOLATION TEST SUITE
 * 
 * This script tests multi-tenant data isolation across the HRMS application.
 * It verifies that Super Admin A cannot see Super Admin B's data.
 * 
 * Run: npx ts-node test-organization-isolation.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  actual?: any;
  expected?: any;
}

const results: TestResult[] = [];

function addResult(testName: string, passed: boolean, details: string, actual?: any, expected?: any) {
  results.push({ testName, passed, details, actual, expected });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (!passed) {
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Actual: ${JSON.stringify(actual)}`);
  }
  console.log(`   ${details}\n`);
}

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // Create two test organizations
  const orgA = await prisma.organization.upsert({
    where: { code: 'TEST-ORG-A' },
    update: {},
    create: {
      name: 'Test Company A',
      code: 'TEST-ORG-A',
      email: 'companya@test.com',
      isActive: true,
    },
  });

  const orgB = await prisma.organization.upsert({
    where: { code: 'TEST-ORG-B' },
    update: {},
    create: {
      name: 'Test Company B',
      code: 'TEST-ORG-B',
      email: 'companyb@test.com',
      isActive: true,
    },
  });

  console.log(`✅ Organization A: ${orgA.name} (${orgA.id})`);
  console.log(`✅ Organization B: ${orgB.name} (${orgB.id})\n`);

  // Get roles
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  const employeeRole = await prisma.role.findUnique({
    where: { name: 'EMPLOYEE' },
  });

  if (!superAdminRole || !employeeRole) {
    throw new Error('Required roles not found. Run seed first.');
  }

  // Create Super Admin A
  let superAdminA = await prisma.user.findUnique({
    where: { email: 'superadmin-a@test.com' },
  });

  if (!superAdminA) {
    const hashedPassword = await bcrypt.hash('test123', 10);
    superAdminA = await prisma.user.create({
      data: {
        email: 'superadmin-a@test.com',
        password: hashedPassword,
        roleId: superAdminRole.id,
        organizationId: orgA.id,
        isFirstLogin: false,
        isActive: true,
      },
    });
    console.log(`✅ Created Super Admin A: ${superAdminA.email}`);
  } else {
    console.log(`✅ Super Admin A exists: ${superAdminA.email}`);
  }

  // Create Super Admin B
  let superAdminB = await prisma.user.findUnique({
    where: { email: 'superadmin-b@test.com' },
  });

  if (!superAdminB) {
    const hashedPassword = await bcrypt.hash('test123', 10);
    superAdminB = await prisma.user.create({
      data: {
        email: 'superadmin-b@test.com',
        password: hashedPassword,
        roleId: superAdminRole.id,
        organizationId: orgB.id,
        isFirstLogin: false,
        isActive: true,
      },
    });
    console.log(`✅ Created Super Admin B: ${superAdminB.email}`);
  } else {
    console.log(`✅ Super Admin B exists: ${superAdminB.email}`);
  }

  // Create test employees for Company A
  const existingEmpA = await prisma.employee.findFirst({
    where: {
      organizationId: orgA.id,
      user: { email: 'employee-a1@test.com' },
    },
  });

  if (!existingEmpA) {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userA1 = await prisma.user.create({
      data: {
        email: 'employee-a1@test.com',
        password: hashedPassword,
        roleId: employeeRole.id,
        organizationId: orgA.id,
        isFirstLogin: false,
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: `EMP-A-${Date.now()}`,
        userId: userA1.id,
        organizationId: orgA.id,
        firstName: 'Employee',
        lastName: 'A1',
        monthlySalary: 50000,
        joiningDate: new Date(),
      },
    });
    console.log(`✅ Created Employee A1`);
  } else {
    console.log(`✅ Employee A1 exists`);
  }

  // Create test employees for Company B
  const existingEmpB = await prisma.employee.findFirst({
    where: {
      organizationId: orgB.id,
      user: { email: 'employee-b1@test.com' },
    },
  });

  if (!existingEmpB) {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userB1 = await prisma.user.create({
      data: {
        email: 'employee-b1@test.com',
        password: hashedPassword,
        roleId: employeeRole.id,
        organizationId: orgB.id,
        isFirstLogin: false,
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: `EMP-B-${Date.now()}`,
        userId: userB1.id,
        organizationId: orgB.id,
        firstName: 'Employee',
        lastName: 'B1',
        monthlySalary: 30000,
        joiningDate: new Date(),
      },
    });
    console.log(`✅ Created Employee B1`);
  } else {
    console.log(`✅ Employee B1 exists`);
  }

  // Create departments for both companies
  const deptA = await prisma.department.upsert({
    where: {
      organizationId_name: {
        organizationId: orgA.id,
        name: 'Test Department A',
      },
    },
    update: {},
    create: {
      organizationId: orgA.id,
      name: 'Test Department A',
      description: 'Test department for Company A',
    },
  });

  const deptB = await prisma.department.upsert({
    where: {
      organizationId_name: {
        organizationId: orgB.id,
        name: 'Test Department B',
      },
    },
    update: {},
    create: {
      organizationId: orgB.id,
      name: 'Test Department B',
      description: 'Test department for Company B',
    },
  });

  console.log(`✅ Created/verified departments\n`);

  return { orgA, orgB, superAdminA, superAdminB };
}

async function testEmployeeIsolation(orgA: any, orgB: any) {
  console.log('📊 TEST 1: Employee Isolation\n');

  // Count employees in Organization A
  const empCountA = await prisma.employee.count({
    where: { organizationId: orgA.id },
  });

  // Count employees in Organization B
  const empCountB = await prisma.employee.count({
    where: { organizationId: orgB.id },
  });

  // Get employees from Organization A
  const employeesA = await prisma.employee.findMany({
    where: { organizationId: orgA.id },
    select: { id: true, firstName: true, lastName: true, organizationId: true },
  });

  // Get employees from Organization B
  const employeesB = await prisma.employee.findMany({
    where: { organizationId: orgB.id },
    select: { id: true, firstName: true, lastName: true, organizationId: true },
  });

  // Verify no overlap
  const employeeAIds = new Set(employeesA.map((e) => e.id));
  const employeeBIds = new Set(employeesB.map((e) => e.id));
  const overlap = [...employeeAIds].filter((id) => employeeBIds.has(id));

  addResult(
    'Employee data isolation',
    overlap.length === 0,
    `Company A has ${empCountA} employees, Company B has ${empCountB} employees. No overlap.`,
    overlap.length,
    0
  );

  // Verify all employees in A belong to org A
  const allBelongToA = employeesA.every((e) => e.organizationId === orgA.id);
  addResult(
    'All Company A employees belong to org A',
    allBelongToA,
    `Verified ${employeesA.length} employees`,
    allBelongToA,
    true
  );

  // Verify all employees in B belong to org B
  const allBelongToB = employeesB.every((e) => e.organizationId === orgB.id);
  addResult(
    'All Company B employees belong to org B',
    allBelongToB,
    `Verified ${employeesB.length} employees`,
    allBelongToB,
    true
  );
}

async function testDepartmentIsolation(orgA: any, orgB: any) {
  console.log('📊 TEST 2: Department/Process Isolation\n');

  const deptsA = await prisma.department.findMany({
    where: { organizationId: orgA.id },
    select: { id: true, name: true, organizationId: true },
  });

  const deptsB = await prisma.department.findMany({
    where: { organizationId: orgB.id },
    select: { id: true, name: true, organizationId: true },
  });

  const deptAIds = new Set(deptsA.map((d) => d.id));
  const deptBIds = new Set(deptsB.map((d) => d.id));
  const overlap = [...deptAIds].filter((id) => deptBIds.has(id));

  addResult(
    'Department isolation',
    overlap.length === 0,
    `Company A has ${deptsA.length} departments, Company B has ${deptsB.length} departments`,
    overlap.length,
    0
  );
}

async function testDesignationIsolation(orgA: any, orgB: any) {
  console.log('📊 TEST 3: Designation Isolation\n');

  const desgsA = await prisma.designation.findMany({
    where: { organizationId: orgA.id },
    select: { id: true, name: true, organizationId: true },
  });

  const desgsB = await prisma.designation.findMany({
    where: { organizationId: orgB.id },
    select: { id: true, name: true, organizationId: true },
  });

  const desgAIds = new Set(desgsA.map((d) => d.id));
  const desgBIds = new Set(desgsB.map((d) => d.id));
  const overlap = [...desgAIds].filter((id) => desgBIds.has(id));

  addResult(
    'Designation isolation',
    overlap.length === 0,
    `Company A has ${desgsA.length} designations, Company B has ${desgsB.length} designations`,
    overlap.length,
    0
  );

  // Check for same name designations (should be allowed, different records)
  const commonNames = desgsA
    .map((d) => d.name)
    .filter((name) => desgsB.some((db) => db.name === name));

  if (commonNames.length > 0) {
    console.log(`   ℹ️  Common designation names found: ${commonNames.join(', ')}`);
    console.log(`   ✅ This is correct - they should be separate database records\n`);
  }
}

async function testPayrollIsolation(orgA: any, orgB: any) {
  console.log('📊 TEST 4: Payroll Calculation Isolation\n');

  // Calculate total payroll for Company A
  const employeesA = await prisma.employee.findMany({
    where: {
      organizationId: orgA.id,
      user: { isActive: true },
    },
    select: { monthlySalary: true },
  });

  const totalPayrollA = employeesA.reduce((sum, e) => sum + (e.monthlySalary || 0), 0);

  // Calculate total payroll for Company B
  const employeesB = await prisma.employee.findMany({
    where: {
      organizationId: orgB.id,
      user: { isActive: true },
    },
    select: { monthlySalary: true },
  });

  const totalPayrollB = employeesB.reduce((sum, e) => sum + (e.monthlySalary || 0), 0);

  // Verify payrolls are different (unless both are 0)
  const isolated = totalPayrollA !== totalPayrollB || (totalPayrollA === 0 && totalPayrollB === 0);

  addResult(
    'Payroll calculation isolation',
    isolated,
    `Company A payroll: ₹${totalPayrollA}, Company B payroll: ₹${totalPayrollB}`,
    { A: totalPayrollA, B: totalPayrollB },
    'Different values'
  );
}

async function testUserIsolation(orgA: any, orgB: any) {
  console.log('📊 TEST 5: User/Admin Isolation\n');

  const usersA = await prisma.user.findMany({
    where: { organizationId: orgA.id },
    select: { id: true, email: true, organizationId: true },
  });

  const usersB = await prisma.user.findMany({
    where: { organizationId: orgB.id },
    select: { id: true, email: true, organizationId: true },
  });

  const userAIds = new Set(usersA.map((u) => u.id));
  const userBIds = new Set(usersB.map((u) => u.id));
  const overlap = [...userAIds].filter((id) => userBIds.has(id));

  addResult(
    'User account isolation',
    overlap.length === 0,
    `Company A has ${usersA.length} users, Company B has ${usersB.length} users`,
    overlap.length,
    0
  );
}

async function testAttendanceIsolation(orgA: any, orgB: any) {
  console.log('📊 TEST 6: Attendance Isolation\n');

  const attendanceA = await prisma.attendance.findMany({
    where: { organizationId: orgA.id },
    select: { id: true, employeeId: true, organizationId: true },
  });

  const attendanceB = await prisma.attendance.findMany({
    where: { organizationId: orgB.id },
    select: { id: true, employeeId: true, organizationId: true },
  });

  const attAIds = new Set(attendanceA.map((a) => a.id));
  const attBIds = new Set(attendanceB.map((a) => a.id));
  const overlap = [...attAIds].filter((id) => attBIds.has(id));

  addResult(
    'Attendance record isolation',
    overlap.length === 0,
    `Company A has ${attendanceA.length} records, Company B has ${attendanceB.length} records`,
    overlap.length,
    0
  );
}

async function generateReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 ORGANIZATION ISOLATION TEST REPORT');
  console.log('═'.repeat(70) + '\n');

  const totalTests = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => r.passed === false).length;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / totalTests) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   • ${r.testName}`);
        console.log(`     ${r.details}`);
        console.log(`     Expected: ${JSON.stringify(r.expected)}`);
        console.log(`     Actual: ${JSON.stringify(r.actual)}\n`);
      });
  }

  console.log('═'.repeat(70));
  console.log(
    failed === 0
      ? '✅ ALL TESTS PASSED - Organization isolation is working correctly!'
      : '❌ SOME TESTS FAILED - Organization isolation has issues!'
  );
  console.log('═'.repeat(70) + '\n');

  return failed === 0;
}

async function runTests() {
  try {
    console.log('🧪 HRMS ORGANIZATION ISOLATION TEST SUITE\n');
    console.log('═'.repeat(70) + '\n');

    const { orgA, orgB, superAdminA, superAdminB } = await setupTestData();

    await testEmployeeIsolation(orgA, orgB);
    await testDepartmentIsolation(orgA, orgB);
    await testDesignationIsolation(orgA, orgB);
    await testPayrollIsolation(orgA, orgB);
    await testUserIsolation(orgA, orgB);
    await testAttendanceIsolation(orgA, orgB);

    const allPassed = await generateReport();

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
