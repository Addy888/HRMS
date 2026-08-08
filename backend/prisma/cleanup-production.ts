import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupProduction() {
  console.log('🧹 Starting production data cleanup...\n');

  try {
    // ─────────────────────────────────────────────────────
    // 1. DELETE ALL EMPLOYEE-RELATED DATA
    // ─────────────────────────────────────────────────────
    
    // Get all employee users (non-HR)
    const employeeRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
    if (!employeeRole) {
      console.log('⚠️  EMPLOYEE role not found - skipping');
      return;
    }

    const employeeUsers = await prisma.user.findMany({
      where: { roleId: employeeRole.id },
      include: { employee: true },
    });

    console.log(`Found ${employeeUsers.length} employee accounts to remove\n`);

    for (const user of employeeUsers) {
      if (!user.employee) continue;

      const empId = user.employee.id;
      const empName = `${user.employee.firstName} ${user.employee.lastName}`;
      const empEmail = user.email;

      console.log(`Cleaning employee: ${empName} (${empEmail})`);

      // Delete in correct order to respect foreign key constraints
      await prisma.companyPolicyAcceptance.deleteMany({ where: { employeeId: empId } });
      await prisma.policyAcceptance.deleteMany({ where: { employeeId: empId } });
      await prisma.acknowledgement.deleteMany({ where: { employeeId: empId } });
      await prisma.document.deleteMany({ where: { employeeId: empId } });
      await prisma.attendanceHistory.deleteMany({ where: { attendance: { employeeId: empId } } });
      await prisma.attendanceCorrection.deleteMany({ where: { employeeId: empId } });
      await prisma.attendanceLog.deleteMany({ where: { employeeId: empId } });
      await prisma.attendance.deleteMany({ where: { employeeId: empId } });
      await prisma.shiftAssignment.deleteMany({ where: { employeeId: empId } });
      await prisma.payslip.deleteMany({ where: { employeeId: empId } });
      await prisma.payrollRun.deleteMany({ where: { employeeId: empId } });
      await prisma.loan.deleteMany({ where: { employeeId: empId } });
      await prisma.advanceSalary.deleteMany({ where: { employeeId: empId } });
      await prisma.salaryStructure.deleteMany({ where: { employeeId: empId } });
      
      // Delete complaints and related data
      const complaints = await prisma.complaint.findMany({
        where: { raisedById: empId },
        select: { id: true },
      });
      for (const complaint of complaints) {
        await prisma.complaintReply.deleteMany({ where: { complaintId: complaint.id } });
        await prisma.complaintAttachment.deleteMany({ where: { complaintId: complaint.id } });
        await prisma.complaintTimeline.deleteMany({ where: { complaintId: complaint.id } });
        await prisma.complaintAuditLog.deleteMany({ where: { complaintId: complaint.id } });
        await prisma.complaintAssignment.deleteMany({ where: { complaintId: complaint.id } });
      }
      await prisma.complaint.deleteMany({ where: { raisedById: empId } });
      
      await prisma.education.deleteMany({ where: { employeeId: empId } });
      await prisma.experience.deleteMany({ where: { employeeId: empId } });
      await prisma.employeeProfile.deleteMany({ where: { employeeId: empId } });

      // Delete notifications
      await prisma.notificationRecipient.deleteMany({ where: { userId: user.id } });
      await prisma.announcementRecipient.deleteMany({ where: { userId: user.id } });
      await prisma.notificationPreference.deleteMany({ where: { userId: user.id } });
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      
      // Delete auth-related
      await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
      // OTP verification table doesn't exist (feature disabled)
      // await prisma.otpVerification.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { userId: user.id } });

      // Finally delete employee and user
      await prisma.employee.delete({ where: { id: empId } });
      await prisma.user.delete({ where: { id: user.id } });

      console.log(`  ✔ Removed: ${empName}`);
    }

    console.log(`\n✔ Deleted ${employeeUsers.length} employee accounts`);

    // ─────────────────────────────────────────────────────
    // 2. DELETE DEMO POLICIES (OPTIONAL)
    // ─────────────────────────────────────────────────────
    /*
    const demoPolicies = await prisma.policy.findMany({
      where: {
        policyNumber: { in: ['POL-001', 'POL-002', 'POL-003', 'POL-004', 'POL-005'] }
      }
    });

    for (const policy of demoPolicies) {
      await prisma.policyVersion.deleteMany({ where: { policyId: policy.id } });
      await prisma.policyAuditLog.deleteMany({ where: { policyId: policy.id } });
      await prisma.policyAssignment.deleteMany({ where: { policyId: policy.id } });
      await prisma.policy.delete({ where: { id: policy.id } });
    }

    console.log(`✔ Deleted ${demoPolicies.length} demo policies`);
    */

    console.log('\n✅ Production cleanup complete!\n');
    console.log('─────────────────────────────────────────────────────');
    console.log('  Employee accounts removed');
    console.log('  HR account preserved: sumaiyyatamboli50@gmail.com');
    console.log('  System is production-ready');
    console.log('─────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

cleanupProduction()
  .catch((e) => {
    console.error('❌ Cleanup script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
