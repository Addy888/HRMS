/**
 * INTERNAL ATTENDANCE PROVIDER
 * 
 * Implementation of IAttendanceProvider that uses our internal Attendance module.
 * 
 * This provider queries the Attendance tables to get attendance data for payroll.
 * 
 * KEY PRINCIPLE: Only this provider knows about Attendance tables.
 * Payroll Engine only knows about IAttendanceProvider interface.
 * 
 * This allows switching to external attendance systems without
 * changing payroll logic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service.js';
import { IAttendanceProvider } from '../base/attendance-provider.interface.js';
import { IAttendanceData } from '../../interfaces/payroll-data.interface.js';
import { startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class InternalAttendanceProvider implements IAttendanceProvider {
  private readonly logger = new Logger(InternalAttendanceProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  getName(): string {
    return 'INTERNAL_ATTENDANCE';
  }

  async getAttendanceData(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<IAttendanceData> {
    this.logger.log(`Fetching attendance data for employee ${employeeId}, ${month}/${year}`);

    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));

    // Get all attendance records for the month
    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get working days (excluding holidays and week-offs)
    const totalWorkingDays = attendances.filter(a => 
      !['HOLIDAY', 'WEEK_OFF'].includes(a.status)
    ).length;

    // Count statuses
    const daysPresent = attendances.filter(a => 
      ['PRESENT', 'WFH', 'ON_DUTY'].includes(a.status)
    ).length;

    const daysAbsent = attendances.filter(a => a.status === 'ABSENT').length;

    const daysLate = attendances.filter(a => a.status === 'LATE').length;

    const daysHalfDay = attendances.filter(a => a.status === 'HALF_DAY').length;

    // Calculate working hours and overtime
    const totalWorkingHours = attendances.reduce((sum, a) => 
      sum + (a.workingHours || 0), 0
    );

    const overtimeHours = attendances.reduce((sum, a) => 
      sum + (a.overtime || 0), 0
    );

    // Calculate late and early exit minutes
    const lateMinutes = attendances.reduce((sum, a) => 
      sum + (a.lateBy || 0), 0
    );

    const earlyExitMinutes = attendances.reduce((sum, a) => 
      sum + (a.earlyExitBy || 0), 0
    );

    return {
      employeeId,
      month,
      year,
      totalWorkingDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysHalfDay,
      totalWorkingHours,
      overtimeHours,
      lateMinutes,
      earlyExitMinutes,
    };
  }

  async getBulkAttendanceData(
    employeeIds: string[],
    month: number,
    year: number,
  ): Promise<Map<string, IAttendanceData>> {
    this.logger.log(`Fetching bulk attendance data for ${employeeIds.length} employees, ${month}/${year}`);

    const resultMap = new Map<string, IAttendanceData>();

    // Fetch in parallel for better performance
    await Promise.all(
      employeeIds.map(async (employeeId) => {
        const data = await this.getAttendanceData(employeeId, month, year);
        resultMap.set(employeeId, data);
      })
    );

    return resultMap;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Check if we can query attendance table
      await this.prisma.attendance.findFirst();
      
      return {
        healthy: true,
        message: 'Internal Attendance Provider is operational',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Internal Attendance Provider error: ${error.message}`,
      };
    }
  }
}
