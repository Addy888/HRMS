/**
 * Multi-Tenant Setup Verification Script
 * Run this to verify the database is properly configured for multi-tenancy
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMultiTenant() {
  console.log('🔍 Testing Multi-Tenant Setup...\n');

  try {
    // Test 1: Check Organization exists
    console.log('Test 1: Checking organizations...');
    const orgs = await prisma.organization.findMany();
    console.log(`✅ Found ${orgs.length} organization(s)`);
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.code})`);
    });
    console.log('');

    // Test 2: Check Users have organizationId
    console.log('Test 2: Checking users have organizationId...');
    const users = await prisma.user.findMany({
      include: {
        role: true,
        organization: true,
      },
    });
    console.log(`✅ Found ${users.length} user(s)`);
    users.forEach(user => {
      console.log(`   - ${user.email} → Organization: ${user.organization?.name || 'MISSING!'} (Role: ${user.role.name})`);
    });
    console.log('');

    // Test 3: Check Employees have organizationId
    console.log('Test 3: Checking employees have organizationId...');
    const employees = await prisma.employee.findMany({
      include: {
        organization: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    console.log(`✅ Found ${employees.length} employee(s)`);
    employees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.user.email}) → ${emp.organization?.name || 'MISSING!'}`);
    });
    console.log('');

    // Test 4: Check Departments are organization-scoped
    console.log('Test 4: Checking departments are organization-scoped...');
    const departments = await prisma.department.findMany({
      include: {
        organization: true,
      },
    });
    console.log(`✅ Found ${departments.length} department(s)`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} → ${dept.organization?.name || 'MISSING!'}`);
    });
    console.log('');

    // Test 5: Check Roles
    console.log('Test 5: Checking roles...');
    const roles = await prisma.role.findMany({
      orderBy: {
        level: 'desc',
      },
    });
    console.log(`✅ Found ${roles.length} role(s)`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (Level ${role.level}): ${role.description}`);
    });
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Organizations: ${orgs.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Employees: ${employees.length}`);
    console.log(`Departments: ${departments.length}`);
    console.log(`Roles: ${roles.length}`);
    console.log('');

    // Validation
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ VALIDATION');
    console.log('═══════════════════════════════════════════════════════');

    const validations = [];

    if (orgs.length > 0) {
      validations.push('✅ Organizations table exists and has data');
    } else {
      validations.push('❌ No organizations found! Run: npx prisma db seed');
    }

    const usersWithoutOrg = users.filter(u => !u.organizationId);
    if (usersWithoutOrg.length === 0) {
      validations.push('✅ All users have organizationId');
    } else {
      validations.push(`❌ ${usersWithoutOrg.length} user(s) missing organizationId`);
    }

    const employeesWithoutOrg = employees.filter(e => !e.organizationId);
    if (employeesWithoutOrg.length === 0) {
      validations.push('✅ All employees have organizationId');
    } else {
      validations.push(`❌ ${employeesWithoutOrg.length} employee(s) missing organizationId`);
    }

    const deptsWithoutOrg = departments.filter(d => !d.organizationId);
    if (deptsWithoutOrg.length === 0) {
      validations.push('✅ All departments have organizationId');
    } else {
      validations.push(`❌ ${deptsWithoutOrg.length} department(s) missing organizationId`);
    }

    const hasHrAdmin = roles.some(r => r.name === 'HR_ADMIN');
    const hasHrUser = roles.some(r => r.name === 'HR_USER');
    if (hasHrAdmin && hasHrUser) {
      validations.push('✅ HR_ADMIN and HR_USER roles exist');
    } else {
      validations.push('❌ Missing HR_ADMIN or HR_USER role');
    }

    validations.forEach(v => console.log(v));
    console.log('');

    // Test Accounts
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔑 TEST ACCOUNTS');
    console.log('═══════════════════════════════════════════════════════');
    const hrAdmins = users.filter(u => u.role.name === 'HR_ADMIN' || u.role.name === 'HR');
    if (hrAdmins.length > 0) {
      hrAdmins.forEach(admin => {
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role.name}`);
        console.log(`Organization: ${admin.organization?.name}`);
        console.log('Password: (Check seed file or documentation)');
        console.log('');
      });
    } else {
      console.log('❌ No HR Admin accounts found!');
      console.log('Run: npx prisma db seed');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Multi-Tenant Setup Verification Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Next Steps:');
    console.log('1. If you see ❌ errors, run: npx prisma db seed');
    console.log('2. Fix TypeScript errors: Run backend\\regenerate-prisma.bat');
    console.log('3. Start backend: npm run start:dev');
    console.log('4. Test login with HR Admin accounts listed above');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing multi-tenant setup:', error.message);
    console.log('');
    console.log('Common fixes:');
    console.log('1. Make sure migration is applied: npx prisma migrate deploy');
    console.log('2. Make sure seed ran: npx prisma db seed');
    console.log('3. Check database connection in .env file');
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMultiTenant()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
