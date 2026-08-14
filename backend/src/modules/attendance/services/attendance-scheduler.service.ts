/**
 * ATTENDANCE SCHEDULER SERVICE
 * 
 * Handles automatic checkout at 7 PM for employees who haven't checked out
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { differenceInMinutes } from 'date-fns';
import { getAttendanceBusinessDate } from '../utils/attendance-date.util';

const ATTENDANCE_TIMEZONE = 'Asia/Kolkata';
const OFFICIAL_CHECKOUT_TIME = '19:00'; // 7 PM

@Injectable()
export class AttendanceSchedulerService {
  private readonly logger = new Logger(AttendanceSchedulerService.name);
  private isProcessing = false;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * AUTO CHECKOUT AT 7 PM
   * Runs every hour to check if it's past 7 PM IST
   * If yes, automatically checkout employees who haven't checked out
   */
  @Cron('0 * * * *') // Every hour at minute 0
  async autoCheckoutAt7PM() {
    // Prevent concurrent execution
    if (this.isProcessing) {
      this.logger.warn('[AUTO-CHECKOUT] Already processing, skipping...');
      return;
    }

    try {
      this.isProcessing = true;

      // Get current time in IST
      const now = new Date();
      const istNow = toZonedTime(now, ATTENDANCE_TIMEZONE);
      const currentHour = istNow.getHours();
      const currentMinute = istNow.getMinutes();

      this.logger.log(`[AUTO-CHECKOUT] Running at IST: ${istNow.toLocaleString('en-IN', { timeZone: ATTENDANCE_TIMEZONE })}`);

      // Only process if current time is >= 7:00 PM IST
      const [officialHour, officialMinute] = OFFICIAL_CHECKOUT_TIME.split(':').map(Number);
      
      if (currentHour < officialHour || (currentHour === officialHour && currentMinute < officialMinute)) {
        this.logger.log('[AUTO-CHECKOUT] Not yet 7 PM IST, skipping');
        return;
      }

      // Get today's business date
      const todayBusinessDate = getAttendanceBusinessDate();

      this.logger.log(`[AUTO-CHECKOUT] Processing for date: ${todayBusinessDate.toISOString().split('T')[0]}`);

      // Find all attendance records for today where:
      // - checkInTime is not null (employee checked in)
      // - checkOutTime is null (employee hasn't checked out)
      const pendingCheckouts = await this.prisma.attendance.findMany({
        where: {
          date: todayBusinessDate,
          checkInTime: { not: null },
          checkOutTime: null,
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          shift: true,
        },
      });

      if (pendingCheckouts.length === 0) {
        this.logger.log('[AUTO-CHECKOUT] No pending checkouts found');
        return;
      }

      this.logger.log(`[AUTO-CHECKOUT] Found ${pendingCheckouts.length} pending checkouts`);

      // Create official checkout time: Today at 7:00 PM IST
      const checkoutTime = new Date(istNow);
      checkoutTime.setHours(officialHour, officialMinute, 0, 0);
      const checkoutTimeUTC = fromZonedTime(checkoutTime, ATTENDANCE_TIMEZONE);

      let successCount = 0;
      let errorCount = 0;

      // Process each pending checkout
      for (const attendance of pendingCheckouts) {
        try {
          // Calculate working hours
          const checkInTime = attendance.checkInTime!;
          const totalMinutes = differenceInMinutes(checkoutTimeUTC, checkInTime);
          const workingHours = totalMinutes / 60;

          // Calculate with shift details if available
          let updateData: any = {
            checkOutTime: checkoutTimeUTC,
            workingHours,
          };

          if (attendance.shift) {
            const shift = attendance.shift;
            const netWorkingHours = Math.max(0, workingHours - (shift.breakTime || 0) / 60);
            const minimumHours = shift.minimumWorkingHours || 8;
            const overtime = shift.overtimeApplicable ? Math.max(0, netWorkingHours - minimumHours) : 0;

            updateData = {
              checkOutTime: checkoutTimeUTC,
              workingHours: netWorkingHours,
              breakTime: shift.breakTime,
              overtime,
              earlyExitBy: 0, // Official time, so no early exit
            };
          }

          // Update attendance record
          await this.prisma.attendance.update({
            where: { id: attendance.id },
            data: updateData,
          });

          successCount++;
          this.logger.log(
            `[AUTO-CHECKOUT] ✅ Checked out employee ${attendance.employee.employeeId} - Working hours: ${workingHours.toFixed(2)}h`,
          );
        } catch (error: any) {
          errorCount++;
          this.logger.error(
            `[AUTO-CHECKOUT] ❌ Failed to checkout employee ${attendance.employee.employeeId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `[AUTO-CHECKOUT] Completed - Success: ${successCount}, Errors: ${errorCount}`,
      );

      // Log the automatic checkout in audit log (optional)
      if (successCount > 0) {
        await this.logAutomaticCheckout(successCount, todayBusinessDate);
      }
    } catch (error: any) {
      this.logger.error(`[AUTO-CHECKOUT] Critical error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Log automatic checkout event
   */
  private async logAutomaticCheckout(count: number, date: Date) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'AUTO_CHECKOUT_7PM',
          details: JSON.stringify({
            date: date.toISOString().split('T')[0],
            count,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: 'SYSTEM',
          userAgent: 'AttendanceScheduler',
        },
      });
    } catch (error) {
      this.logger.warn('Failed to log automatic checkout audit entry');
    }
  }

  /**
   * Manual trigger for testing (can be called from a controller endpoint)
   */
  async triggerAutoCheckoutManually() {
    this.logger.log('[AUTO-CHECKOUT] Manual trigger initiated');
    return await this.autoCheckoutAt7PM();
  }
}
