import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  OnboardingStatus,
  DocumentStatus,
} from '../../common/constants/index.js';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getHRStats() {
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
      // Total Employees (excluding Admin HR account)
      this.prisma.employee.count({
        where: { user: { role: { name: { not: 'HR' } } } },
      }),
      // Active Employees
      this.prisma.employee.count({
        where: {
          user: {
            role: { name: { not: 'HR' } },
            isActive: true,
          },
        },
      }),
      // Inactive Employees
      this.prisma.employee.count({
        where: {
          user: {
            role: { name: { not: 'HR' } },
            isActive: false,
          },
        },
      }),
      // Pending Onboarding
      this.prisma.employee.count({
        where: { onboardingStatus: { not: OnboardingStatus.VERIFIED } },
      }),
      // Completed Onboarding
      this.prisma.employee.count({
        where: { onboardingStatus: OnboardingStatus.VERIFIED },
      }),
      // Pending Documents
      this.prisma.document.count({
        where: { status: DocumentStatus.PENDING },
      }),
      // Pending Complaints (OPEN or IN_PROGRESS status)
      this.prisma.complaint.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      // Total Departments count
      this.prisma.department.count(),
      // Total Designations count
      this.prisma.designation.count(),
      // Recently Joined Employees (Last 5)
      this.prisma.employee.findMany({
        where: { user: { role: { name: { not: 'HR' } } } },
        orderBy: { joiningDate: 'desc' },
        take: 5,
        include: {
          department: true,
          designation: true,
        },
      }),
      // Recent System Audit Logs (Last 10)
      this.prisma.auditLog.findMany({
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
