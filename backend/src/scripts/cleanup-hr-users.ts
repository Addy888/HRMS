/**
 * HR User Cleanup Script
 * 
 * SAFETY RULES:
 * 1. NEVER delete sumaiyyatamboli50@gmail.com
 * 2. Only delete the specified test accounts
 * 3. Handle foreign key constraints properly
 * 4. Log all actions for audit trail
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ PROTECTED ACCOUNT - MUST NEVER BE DELETED
const PROTECTED_EMAIL = 'sumaiyyatamboli50@gmail.com';

// ✅ ACCOUNTS TO DELETE - EXACT EMAIL MATCH
const EMAILS_TO_DELETE = [
  'test1@gmail.com',
  'test1233@gmail.com',
  'adityashastri76@gmail.com',
];

async function cleanupHRUsers() {
  console.log('🔍 Starting HR User Cleanup...\n');

  try {
    // ✅ Step 1: Verify protected account is NOT in deletion list
    if (EMAILS_TO_DELETE.includes(PROTECTED_EMAIL)) {
      throw new Error(`❌ CRITICAL ERROR: Protected account ${PROTECTED_EMAIL} is in deletion list!`);
    }

    // ✅ Step 2: Find all HR users to delete
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: { in: EMAILS_TO_DELETE },
      },
      include: {
        role: true,
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    if (usersToDelete.length === 0) {
      console.log('✅ No matching HR users found to delete.');
      return;
    }

    console.log(`📋 Found ${usersToDelete.length} HR user(s) to delete:\n`);
    usersToDelete.forEach((user) => {
      console.log(`  - ${user.email} (${user.role.name})`);
      if (user.employee) {
        console.log(`    Employee: ${user.employee.firstName} ${user.employee.lastName} (${user.employee.employeeId})`);
        console.log(`    Department: ${user.employee.department?.name || 'None'}`);
      }
    });
    console.log('');

    // ✅ Step 3: Double-check protected account is not in the list
    const protectedUserInList = usersToDelete.find(u => u.email === PROTECTED_EMAIL);
    if (protectedUserInList) {
      throw new Error(`❌ CRITICAL ERROR: Protected account ${PROTECTED_EMAIL} found in deletion list!`);
    }

    // ✅ Step 4: Delete each user with their related data
    for (const user of usersToDelete) {
      console.log(`🗑️  Deleting user: ${user.email}...`);

      await prisma.$transaction(async (tx) => {
        // Get employee if exists
        const employee = user.employee;

        if (employee) {
          // Delete employee-related records that have CASCADE or need manual cleanup
          // Most relations have onDelete: Cascade, so they will be auto-deleted

          // Delete HR Actions issued by this HR user (must delete, issuedById is required)
          const hrActionsCount = await tx.hRAction.deleteMany({
            where: { issuedById: user.id },
          });
          if (hrActionsCount.count > 0) {
            console.log(`  ✓ Deleted ${hrActionsCount.count} HR action(s) issued by this user`);
          }

          // Update HR Actions acknowledged by this user (set to NULL - these are optional)
          const acknowledgedCount = await tx.hRAction.updateMany({
            where: { acknowledgedById: user.id },
            data: { acknowledgedById: null },
          });
          if (acknowledgedCount.count > 0) {
            console.log(`  ✓ Updated ${acknowledgedCount.count} acknowledged HR action(s)`);
          }

          // Update HR Actions resolved by this user (set to NULL - these are optional)
          const resolvedCount = await tx.hRAction.updateMany({
            where: { resolvedById: user.id },
            data: { resolvedById: null },
          });
          if (resolvedCount.count > 0) {
            console.log(`  ✓ Updated ${resolvedCount.count} resolved HR action(s)`);
          }

          // Update HR Actions cancelled by this user (set to NULL - these are optional)
          const cancelledCount = await tx.hRAction.updateMany({
            where: { cancelledById: user.id },
            data: { cancelledById: null },
          });
          if (cancelledCount.count > 0) {
            console.log(`  ✓ Updated ${cancelledCount.count} cancelled HR action(s)`);
          }

          // Update complaints where this HR is assigned (set to NULL)
          const assignedComplaintsCount = await tx.complaint.updateMany({
            where: { assignedToId: employee.id },
            data: { assignedToId: null },
          });
          if (assignedComplaintsCount.count > 0) {
            console.log(`  ✓ Updated ${assignedComplaintsCount.count} assigned complaint(s)`);
          }

          const acceptedComplaintsCount = await tx.complaint.updateMany({
            where: { acceptedById: employee.id },
            data: { acceptedById: null },
          });
          if (acceptedComplaintsCount.count > 0) {
            console.log(`  ✓ Updated ${acceptedComplaintsCount.count} accepted complaint(s)`);
          }

          const rejectedComplaintsCount = await tx.complaint.updateMany({
            where: { rejectedById: employee.id },
            data: { rejectedById: null },
          });
          if (rejectedComplaintsCount.count > 0) {
            console.log(`  ✓ Updated ${rejectedComplaintsCount.count} rejected complaint(s)`);
          }

          // Update employees created by this HR user (set to NULL)
          const createdEmployeesCount = await tx.employee.updateMany({
            where: { createdByUserId: user.id },
            data: { createdByUserId: null },
          });
          if (createdEmployeesCount.count > 0) {
            console.log(`  ✓ Updated ${createdEmployeesCount.count} employee(s) created by this HR`);
          }

          console.log(`  ✓ Cleaned up related records for employee: ${employee.employeeId}`);

          // Delete the employee (will cascade to many relations)
          await tx.employee.delete({
            where: { id: employee.id },
          });

          console.log(`  ✓ Deleted employee: ${employee.employeeId}`);
        }

        // Delete user (will cascade to remaining relations)
        await tx.user.delete({
          where: { id: user.id },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: null,
            action: 'HR_USER_DELETED',
            details: `HR user deleted: ${user.email} (${user.role.name}) - Cleanup script`,
          },
        });

        console.log(`  ✅ Deleted user: ${user.email}\n`);
      });
    }

    // ✅ Step 5: Verify protected account still exists
    const protectedUser = await prisma.user.findUnique({
      where: { email: PROTECTED_EMAIL },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!protectedUser) {
      throw new Error(`❌ CRITICAL ERROR: Protected account ${PROTECTED_EMAIL} was deleted!`);
    }

    console.log('✅ VERIFICATION: Protected account still exists:');
    console.log(`   Email: ${protectedUser.email}`);
    console.log(`   Name: ${protectedUser.employee?.firstName} ${protectedUser.employee?.lastName}`);
    console.log(`   Department: ${protectedUser.employee?.department?.name || 'None'}`);
    console.log(`   Active: ${protectedUser.isActive}\n`);

    // ✅ Step 6: Show remaining HR users
    const remainingHRUsers = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] },
        },
      },
      include: {
        role: true,
        employee: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Remaining HR users (${remainingHRUsers.length}):\n`);
    remainingHRUsers.forEach((user) => {
      console.log(`  ✓ ${user.email} (${user.role.name})`);
      if (user.employee) {
        console.log(`    ${user.employee.firstName} ${user.employee.lastName}`);
        console.log(`    Department: ${user.employee.department?.name || 'None'}`);
        console.log(`    Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      }
      console.log('');
    });

    console.log('✅ HR User Cleanup completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupHRUsers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
