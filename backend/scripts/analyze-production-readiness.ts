/**
 * Production Readiness Analysis Script
 * Analyzes database to identify test/dummy data vs production data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('═'.repeat(80));
  console.log('PRODUCTION READINESS ANALYSIS');
  console.log('═'.repeat(80));

  try {
    // 1. Analyze Organizations
    console.log('\n📊 ORGANIZATIONS:');
    console.log('─'.repeat(80));
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            departments: true,
            designations: true,
          },
        },
      },
    });

    orgs.forEach(org => {
      console.log(`\n   Organization: ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Code: ${org.code}`);
      console.log(`   Users: ${org._count.users}`);
      console.log(`   Employees: ${org._count.employees}`);
      console.log(`   Departments: ${org._count.departments}`);
      console.log(`   Designations: ${org._count.designations}`);
      console.log(`   Active: ${org.isActive}`);
      console.log(`   Created: ${org.createdAt}`);
    });

    // 2. Analyze Users by Role
    console.log('\n\n📊 USERS BY ROLE:');
    console.log('─'.repeat(80));
    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
      },
    });

    for (const role of roles) {
      console.log(`\n   Role: ${role.name} (${role.displayName || 'N/A'})`);
      console.log(`   User Count: ${role._count.users}`);
      
      if (role._count.users > 0) {
        const users = await prisma.user.findMany({
          where: { roleId: role.id },
          include: {
            employee: true,
            organization: true,
          },
        });

        users.forEach(user => {
          console.log(`      - ${user.email}`);
          console.log(`        Active: ${user.isActive}`);
          console.log(`        Organization: ${user.organization.name}`);
          console.log(`        Created: ${user.createdAt}`);
        });
      }
    }

    // 3. Analyze Employee IDs
    console.log('\n\n📊 EMPLOYEE IDs:');
    console.log('─'.repeat(80));
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        user: {
          select: {
            email: true,
            role: { select: { name: true } },
          },
        },
        createdByUser: {
          select: { email: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n   Total Employee Records: ${employees.length}`);
    
    // Categorize by employee ID pattern
    const fcsPattern = employees.filter(e => e.employeeId.startsWith('FCS-'));
    const fcsHrPattern = employees.filter(e => e.employeeId.startsWith('FCS-HR'));
    const others = employees.filter(e => 
      !e.employeeId.startsWith('FCS-') && !e.employeeId.startsWith('FCS-HR')
    );

    console.log(`\n   IDs with FCS- prefix: ${fcsPattern.length}`);
    console.log(`   IDs with FCS-HR prefix: ${fcsHrPattern.length}`);
    console.log(`   Other patterns: ${others.length}`);

    console.log('\n   All Employee IDs:');
    employees.forEach(emp => {
      const isHR = ['HR', 'HR_USER', 'HR_ADMIN', 'Super Admin'].includes(emp.user.role.name);
      console.log(`      ${emp.employeeId} - ${emp.firstName} ${emp.lastName}`);
      console.log(`        Email: ${emp.user.email}`);
      console.log(`        Role: ${emp.user.role.name} ${isHR ? '(HR PROFILE)' : '(EMPLOYEE)'}`);
      console.log(`        Created By: ${emp.createdByUser?.email || 'NULL'}`);
      console.log(`        Created: ${emp.createdAt}`);
    });

    // 4. Analyze Test/Demo Data Indicators
    console.log('\n\n📊 TEST/DEMO DATA INDICATORS:');
    console.log('─'.repeat(80));
    
    const testEmails = await prisma.user.findMany({
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

    console.log(`\n   Users with test/demo emails: ${testEmails.length}`);
    testEmails.forEach(user => {
      console.log(`      - ${user.email} (${user.role.name})`);
      if (user.employee) {
        console.log(`        Employee ID: ${user.employee.employeeId}`);
      }
    });

    // 5. Analyze Documents
    console.log('\n\n📊 DOCUMENTS:');
    console.log('─'.repeat(80));
    const docCount = await prisma.document.count();
    const docsByStatus = await prisma.document.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    console.log(`   Total Documents: ${docCount}`);
    docsByStatus.forEach(status => {
      console.log(`      ${status.status}: ${status._count.id}`);
    });

    // 6. Analyze Complaints
    console.log('\n\n📊 COMPLAINTS:');
    console.log('─'.repeat(80));
    const complaintCount = await prisma.complaint.count();
    const complaintsByStatus = await prisma.complaint.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    console.log(`   Total Complaints: ${complaintCount}`);
    complaintsByStatus.forEach(status => {
      console.log(`      ${status.status}: ${status._count.id}`);
    });

    // 7. Analyze Policies
    console.log('\n\n📊 POLICIES:');
    console.log('─'.repeat(80));
    const policyCount = await prisma.policy.count();
    console.log(`   Total Policies: ${policyCount}`);

    // 8. Analyze Notifications
    console.log('\n\n📊 NOTIFICATIONS:');
    console.log('─'.repeat(80));
    const notificationCount = await prisma.notification.count();
    console.log(`   Total Notifications: ${notificationCount}`);

    // 9. Recommendations
    console.log('\n\n═'.repeat(80));
    console.log('RECOMMENDATIONS:');
    console.log('═'.repeat(80));

    console.log('\n✅ KEEP (Production Data):');
    const productionUsers = employees.filter(e => 
      !e.user.email.includes('test') && 
      !e.user.email.includes('demo') &&
      e.user.role.name === 'EMPLOYEE'
    );
    
    if (productionUsers.length > 0) {
      console.log(`   ${productionUsers.length} real employee(s) found`);
      productionUsers.forEach(emp => {
        console.log(`      - ${emp.employeeId}: ${emp.user.email}`);
      });
    } else {
      console.log('   No production employees identified');
    }

    console.log('\n❌ REMOVE (Test/Demo Data):');
    if (testEmails.length > 0) {
      console.log(`   ${testEmails.length} test/demo user(s) found`);
      testEmails.forEach(user => {
        console.log(`      - ${user.email} (${user.role.name})`);
      });
    } else {
      console.log('   No obvious test data found');
    }

    console.log('\n⚠️  REVIEW MANUALLY:');
    console.log('   - Organizations with "Default" or "Test" in name');
    console.log('   - Departments created for testing');
    console.log('   - Designations created for testing');
    console.log('   - Employee IDs not following production pattern');

    console.log('\n═'.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR during analysis:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase()
  .then(() => {
    console.log('\n✅ Analysis complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:');
    console.error(error);
    process.exit(1);
  });
