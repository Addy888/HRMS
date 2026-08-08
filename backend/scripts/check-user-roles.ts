/**
 * Debug Script: Check User Roles and Employee Ownership
 * 
 * This script checks the actual role names and employee ownership in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoles() {
  console.log('='.repeat(70));
  console.log('DATABASE ROLE AND OWNERSHIP ANALYSIS');
  console.log('='.repeat(70));

  try {
    // Check all roles in the database
    console.log('\n📋 ROLES IN DATABASE:');
    console.log('-'.repeat(70));
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        _count: {
          select: { users: true },
        },
      },
    });

    roles.forEach((role) => {
      console.log(`   Role: "${role.name}"`);
      console.log(`   Display Name: ${role.displayName || 'N/A'}`);
      console.log(`   User Count: ${role._count.users}`);
      console.log(`   ID: ${role.id}`);
      console.log();
    });

    // Check specific test users
    console.log('\n📋 TEST USERS:');
    console.log('-'.repeat(70));
    
    const testEmails = ['test1@gmail.com', 'sumaiyyatamboli50@gmail.com'];
    
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: true,
          organization: true,
          employee: true,
        },
      });

      if (user) {
        console.log(`\n✅ User: ${email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Role Name: "${user.role.name}"`);
        console.log(`   Role Display: ${user.role.displayName || 'N/A'}`);
        console.log(`   Organization: ${user.organization.name}`);
        console.log(`   Organization ID: ${user.organizationId}`);
        console.log(`   Has Employee Profile: ${!!user.employee}`);
        if (user.employee) {
          console.log(`   Employee ID: ${user.employee.id}`);
        }

        // Check employees created by this user
        const createdEmployees = await prisma.employee.count({
          where: {
            createdByUserId: user.id,
          },
        });
        console.log(`   Employees Created: ${createdEmployees}`);

        // Check all employees in their organization
        const orgEmployees = await prisma.employee.count({
          where: {
            organizationId: user.organizationId,
            user: {
              role: {
                name: 'EMPLOYEE',
              },
            },
          },
        });
        console.log(`   Total Org Employees: ${orgEmployees}`);

      } else {
        console.log(`\n❌ User not found: ${email}`);
      }
    }

    // Check employee ownership distribution
    console.log('\n\n📋 EMPLOYEE OWNERSHIP DISTRIBUTION:');
    console.log('-'.repeat(70));

    const employeeOwnership = await prisma.employee.groupBy({
      by: ['createdByUserId', 'organizationId'],
      _count: {
        id: true,
      },
    });

    for (const group of employeeOwnership) {
      if (group.createdByUserId) {
        const creator = await prisma.user.findUnique({
          where: { id: group.createdByUserId },
          include: { role: true, organization: true },
        });

        console.log(`\n   Creator: ${creator?.email || 'Unknown'}`);
        console.log(`   Role: "${creator?.role.name}"`);
        console.log(`   Organization: ${creator?.organization.name}`);
        console.log(`   Employees Created: ${group._count.id}`);
      } else {
        console.log(`\n   Creator: NULL (unassigned)`);
        console.log(`   Organization ID: ${group.organizationId}`);
        console.log(`   Employees: ${group._count.id}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR during analysis:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
checkUserRoles()
  .then(() => {
    console.log('\n✅ Analysis completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:');
    console.error(error);
    process.exit(1);
  });
