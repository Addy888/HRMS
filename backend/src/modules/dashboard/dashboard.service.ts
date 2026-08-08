import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  OnboardingStatus,
  DocumentStatus,
  UserRole,
} from '../../common/constants/index.js';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getHRStats(userId: string) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[HR DASHBOARD] getHRStats called');
    console.log('userId:', userId);
    
    // ✅ STEP 1: Validate authenticated user
    if (!userId) {
      throw new UnauthorizedException('Authenticated user could not be identified');
    }

    // ✅ STEP 2: Get user details with role and organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    console.log('userRole:', user.role.name);
    console.log('organizationId:', user.organizationId);

    // ✅ STEP 3: Determine scope based on role
    const isHRUser = user.role.name === UserRole.HR_USER || user.role.name === UserRole.HR;
    const isHRAdmin = user.role.name === UserRole.HR_ADMIN || user.role.name === UserRole.SUPER_ADMIN;
    
    console.log('isHRUser:', isHRUser);
    console.log('isHRAdmin:', isHRAdmin);

    // ✅ STEP 4: Build base WHERE clause for HR ownership
    const employeeBaseWhere: any = {
      organizationId: user.organizationId,
      user: { role: { name: UserRole.EMPLOYEE } }, // Exclude HR accounts
    };

    // ✅ CRITICAL: HR_USER can only see employees they created
    if (isHRUser) {
      employeeBaseWhere.createdByUserId = userId;
      console.log('scope: HR_USER - filtering by createdByUserId =', userId);
    } else if (isHRAdmin) {
      console.log('scope: HR_ADMIN - organization-wide access');
    }

    console.log('employeeBaseWhere:', JSON.stringify(employeeBaseWhere, null, 2));

    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      pendingOnboarding,
      completedOnboarding,
      pendingDocuments,
      pendingComplaints,
      totalDepartments,
      totalDesignations,
      recentlyJoined,
      recentActivities,
    ] = await Promise.all([
      // Total Employees (with ownership scope)
      this.prisma.employee.count({
        where: employeeBaseWhere,
      }),
      
      // Active Employees (with ownership scope)
      this.prisma.employee.count({
        where: {
          ...employeeBaseWhere,
          user: {
            ...employeeBaseWhere.user,
            isActive: true,
          },
        },
      }),
      
      // Inactive Employees (with ownership scope)
      this.prisma.employee.count({
        where: {
          ...employeeBaseWhere,
          user: {
            ...employeeBaseWhere.user,
            isActive: false,
          },
        },
      }),
      
      // Pending Onboarding (with ownership scope)
      this.prisma.employee.count({
        where: {
          ...employeeBaseWhere,
          onboardingStatus: { not: OnboardingStatus.VERIFIED },
        },
      }),
      
      // Completed Onboarding (with ownership scope)
      this.prisma.employee.count({
        where: {
          ...employeeBaseWhere,
          onboardingStatus: OnboardingStatus.VERIFIED,
        },
      }),
      
      // Pending Documents (with ownership scope)
      // Documents belong to employees, so filter by employee ownership
      this.prisma.document.count({
        where: {
          status: DocumentStatus.PENDING,
          employee: employeeBaseWhere, // Filter documents by employee ownership
        },
      }),
      
      // Pending Complaints (with ownership scope)
      // For HR_USER: only complaints raised by their employees
      // For HR_ADMIN: all organization complaints
      this.prisma.complaint.count({
        where: {
          organizationId: user.organizationId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          ...(isHRUser ? {
            raisedBy: employeeBaseWhere, // Filter by employee ownership
          } : {}),
        },
      }),
      
      // Total Departments (organization-wide, not HR-specific)
      this.prisma.department.count({
        where: { organizationId: user.organizationId },
      }),
      
      // Total Designations (organization-wide, not HR-specific)
      this.prisma.designation.count({
        where: { organizationId: user.organizationId },
      }),
      
      // Recently Joined Employees (with ownership scope)
      this.prisma.employee.findMany({
        where: employeeBaseWhere,
        orderBy: { joiningDate: 'desc' },
        take: 5,
        include: {
          department: true,
          designation: true,
          user: {
            select: { email: true, isActive: true },
          },
        },
      }),
      
      // Recent System Audit Logs (with ownership scope)
      // For HR_USER: only logs related to their actions or their employees
      // For HR_ADMIN: organization-wide logs
      this.prisma.auditLog.findMany({
        where: isHRUser ? {
          OR: [
            { userId: userId }, // Logs created by this HR user
            { 
              user: { 
                employee: employeeBaseWhere, // Logs related to their employees
              },
            },
          ],
        } : {},
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              email: true,
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[HR DASHBOARD] Query Results:');
    console.log('totalEmployees:', totalEmployees);
    console.log('activeEmployees:', activeEmployees);
    console.log('inactiveEmployees:', inactiveEmployees);
    console.log('pendingOnboarding:', pendingOnboarding);
    console.log('completedOnboarding:', completedOnboarding);
    console.log('pendingDocuments:', pendingDocuments);
    console.log('pendingComplaints:', pendingComplaints);
    console.log('═══════════════════════════════════════════════════════════');

    return {
      cards: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        pendingOnboarding,
        completedOnboarding,
        pendingDocuments,
        pendingComplaints,
        totalDepartments,
        totalDesignations,
      },
      recentlyJoined,
      recentActivities,
    };
  }
}
