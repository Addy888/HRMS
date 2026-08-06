/**
 * AUDIT ENGINE SERVICE
 * 
 * Comprehensive audit logging engine
 * 
 * FEATURES:
 * - Automatic audit trail for all operations
 * - User action tracking
 * - Data change tracking (before/after)
 * - IP address and user agent tracking
 * - Async logging for performance
 * - Audit log search and filtering
 * - Compliance reporting
 * 
 * AUDIT CATEGORIES:
 * - AUTHENTICATION: Login, logout, password changes
 * - USER_MANAGEMENT: User creation, updates, deletion
 * - SETTINGS: System settings changes
 * - PERMISSIONS: Role and permission changes
 * - DATA_ACCESS: Read operations on sensitive data
 * - DATA_MODIFICATION: Create, update, delete operations
 * - SECURITY: Security-related events
 * 
 * USAGE:
 * await auditEngine.log({
 *   userId: user.id,
 *   action: 'UPDATE_PROFILE',
 *   details: 'Updated employee profile',
 *   metadata: { employeeId, changes },
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 * });
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditEngineService {
  private logQueue: AuditLogEntry[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor(private readonly database: PrismaService) {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Log an audit entry (async, queued)
   */
  async log(entry: AuditLogEntry): Promise<void> {
    this.logQueue.push(entry);

    // If queue is full, flush immediately
    if (this.logQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED',
    userId: string,
    details: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      metadata: { category: 'AUTHENTICATION' },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log data change with before/after values
   */
  async logChange(
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    oldData: any,
    newData: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const changes = this.detectChanges(oldData, newData);

    await this.log({
      userId,
      action,
      details: `${action} on ${entityType} ${entityId}`,
      metadata: {
        category: 'DATA_MODIFICATION',
        entityType,
        entityId,
        changes,
        oldData: this.sanitize(oldData),
        newData: this.sanitize(newData),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string | undefined,
    action: string,
    targetRoleId: string,
    permissionId: string,
    granted: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details: `${granted ? 'Granted' : 'Revoked'} permission ${permissionId} for role ${targetRoleId}`,
      metadata: {
        category: 'PERMISSIONS',
        targetRoleId,
        permissionId,
        granted,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log settings change
   */
  async logSettingsChange(
    userId: string | undefined,
    category: string,
    key: string,
    oldValue: any,
    newValue: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'SETTINGS_CHANGED',
      details: `Changed ${category}.${key}`,
      metadata: {
        category: 'SETTINGS',
        settingCategory: category,
        settingKey: key,
        oldValue: this.sanitize(oldValue),
        newValue: this.sanitize(newValue),
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log security event
   */
  async logSecurity(
    action: string,
    details: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      metadata: {
        category: 'SECURITY',
        severity,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Query audit logs
   */
  async query(filter: AuditLogFilter): Promise<{
    logs: any[];
    total: number;
  }> {
    const where: any = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.action) {
      where.action = { contains: filter.action };
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    if (filter.ipAddress) {
      where.ipAddress = filter.ipAddress;
    }

    if (filter.search) {
      where.OR = [
        { action: { contains: filter.search } },
        { details: { contains: filter.search } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.database.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
        include: {
          user: {
            select: {
              id: true,
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
      this.database.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit summary for user
   */
  async getUserSummary(userId: string, days: number = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActions: any[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.database.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const actionsByType: Record<string, number> = {};
    for (const log of logs) {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    }

    return {
      totalActions: logs.length,
      actionsByType,
      recentActions: logs.slice(0, 10),
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(days: number = 30): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByUser: Record<string, number>;
    logsByDay: Array<{ date: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.database.auditLog.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    const logsByAction: Record<string, number> = {};
    const logsByUser: Record<string, number> = {};
    const logsByDay: Record<string, number> = {};

    for (const log of logs) {
      // By action
      logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;

      // By user
      if (log.user) {
        logsByUser[log.user.email] = (logsByUser[log.user.email] || 0) + 1;
      }

      // By day
      const day = log.createdAt.toISOString().split('T')[0];
      logsByDay[day] = (logsByDay[day] || 0) + 1;
    }

    const logsByDayArray = Object.entries(logsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs: logs.length,
      logsByAction,
      logsByUser,
      logsByDay: logsByDayArray,
    };
  }

  /**
   * Export audit logs
   */
  async export(filter: AuditLogFilter): Promise<any[]> {
    const { logs } = await this.query({ ...filter, limit: 10000 });
    return logs;
  }

  /**
   * Flush queued logs to database
   */
  private async flush(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.logQueue.splice(0, this.BATCH_SIZE);

      await this.database.auditLog.createMany({
        data: batch.map(entry => ({
          userId: entry.userId,
          action: entry.action,
          details: entry.details + (entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : ''),
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        })),
      });
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Could implement retry logic here
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    setInterval(async () => {
      await this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Detect changes between old and new data
   */
  private detectChanges(oldData: any, newData: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    if (!oldData || !newData) {
      return changes;
    }

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    }

    return changes;
  }

  /**
   * Sanitize sensitive data (remove passwords, tokens, etc.)
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
      'privateKey',
      'encryptionKey',
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
