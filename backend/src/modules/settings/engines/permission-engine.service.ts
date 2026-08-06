/**
 * PERMISSION ENGINE SERVICE
 *
 * Advanced permission management engine
 *
 * FEATURES:
 * - Hierarchical role-based permissions
 * - Granular access control (Module, Resource, Action)
 * - Dynamic permission checking
 * - Permission caching for performance
 * - Role inheritance support
 * - Field-level permissions (future)
 * - Row-level permissions (future)
 *
 * PERMISSION STRUCTURE:
 * - Format: module:resource:action
 * - Examples:
 *   - employees:user:create
 *   - attendance:view:read
 *   - payroll:salary:update
 *   - settings:system:manage
 *
 * ACCESS LEVELS:
 * - SUPER_ADMIN: Full system access (level 100)
 * - ADMIN: Organization management (level 80)
 * - HR: HR operations (level 60)
 * - MANAGER: Team management (level 40)
 * - EMPLOYEE: Self-service (level 20)
 *
 * USAGE:
 * const hasPermission = await permissionEngine.check(userId, 'employees:user:create');
 * const permissions = await permissionEngine.getUserPermissions(userId);
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CacheEngineService } from './cache-engine.service';

export interface PermissionCheck {
  module: string;
  resource: string;
  action: string;
}

export interface UserPermissions {
  userId: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
  permissions: string[]; // Array of permission codes
  isSuperAdmin: boolean;
}

@Injectable()
export class PermissionEngineService {
  private readonly CACHE_PREFIX = 'permission:user:';
  private readonly CACHE_TTL = 600; // 10 minutes
  private readonly SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

  constructor(
    private readonly database: PrismaService,
    private readonly cache: CacheEngineService,
  ) {}

  /**
   * Check if user has specific permission
   */
  async check(userId: string, permissionCode: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Super admin has all permissions
    if (userPermissions.isSuperAdmin) {
      return true;
    }

    return userPermissions.permissions.includes(permissionCode);
  }

  /**
   * Check multiple permissions (user needs ALL)
   */
  async checkAll(userId: string, permissionCodes: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    if (userPermissions.isSuperAdmin) {
      return true;
    }

    return permissionCodes.every((code) =>
      userPermissions.permissions.includes(code),
    );
  }

  /**
   * Check multiple permissions (user needs ANY)
   */
  async checkAny(userId: string, permissionCodes: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    if (userPermissions.isSuperAdmin) {
      return true;
    }

    return permissionCodes.some((code) =>
      userPermissions.permissions.includes(code),
    );
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;

    // Try cache first
    const cached = await this.cache.get<UserPermissions>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch user with role and permissions
    const user = await this.database.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isSuperAdmin = user.role.name === this.SUPER_ADMIN_ROLE;

    // Extract permission codes
    const permissions = user.role.rolePermissions
      .filter((rp) => rp.granted) // Only granted permissions
      .map((rp) => rp.permission.code);

    const userPermissions: UserPermissions = {
      userId: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      roleLevel: user.role.level,
      permissions,
      isSuperAdmin,
    };

    // Cache the result
    await this.cache.set(cacheKey, userPermissions, this.CACHE_TTL);

    return userPermissions;
  }

  /**
   * Get permissions by module for a user
   */
  async getModulePermissions(
    userId: string,
    module: string,
  ): Promise<string[]> {
    const userPermissions = await this.getUserPermissions(userId);

    if (userPermissions.isSuperAdmin) {
      // Get all permissions for this module
      const allPermissions = await this.database.permission.findMany({
        where: { module },
      });
      return allPermissions.map((p) => p.code);
    }

    return userPermissions.permissions.filter((p) =>
      p.startsWith(`${module}:`),
    );
  }

  /**
   * Check if user has access to module
   */
  async hasModuleAccess(userId: string, module: string): Promise<boolean> {
    const modulePermissions = await this.getModulePermissions(userId, module);
    return modulePermissions.length > 0;
  }

  /**
   * Invalidate user permissions cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.cache.del(cacheKey);
  }

  /**
   * Invalidate all users' permissions cache
   */
  async invalidateAllCache(): Promise<void> {
    await this.cache.delPattern(`${this.CACHE_PREFIX}*`);
  }

  /**
   * Grant permission to role
   */
  async grantPermission(roleId: string, permissionId: string): Promise<void> {
    await this.database.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      create: {
        roleId,
        permissionId,
        granted: true,
      },
      update: {
        granted: true,
      },
    });

    // Invalidate cache for all users with this role
    await this.invalidateRoleCache(roleId);
  }

  /**
   * Revoke permission from role
   */
  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    await this.database.rolePermission.update({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      data: {
        granted: false,
      },
    });

    await this.invalidateRoleCache(roleId);
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<{
    granted: string[];
    denied: string[];
  }> {
    const rolePermissions = await this.database.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    const granted = rolePermissions
      .filter((rp) => rp.granted)
      .map((rp) => rp.permission.code);

    const denied = rolePermissions
      .filter((rp) => !rp.granted)
      .map((rp) => rp.permission.code);

    return { granted, denied };
  }

  /**
   * Sync role permissions (bulk operation)
   */
  async syncRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    // Delete existing permissions
    await this.database.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new permissions
    if (permissionIds.length > 0) {
      await this.database.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          granted: true,
        })),
      });
    }

    await this.invalidateRoleCache(roleId);
  }

  /**
   * Create new permission
   */
  async createPermission(data: {
    module: string;
    resource: string;
    action: string;
    name: string;
    description?: string;
    category?: string;
  }): Promise<any> {
    const code = `${data.module}:${data.resource}:${data.action}`;

    return this.database.permission.create({
      data: {
        module: data.module,
        resource: data.resource,
        action: data.action,
        code,
        name: data.name,
        description: data.description,
        category: data.category,
      },
    });
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<any[]> {
    return this.database.permission.findMany({
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Get permissions grouped by module
   */
  async getPermissionsByModule(): Promise<Record<string, any[]>> {
    const permissions = await this.getAllPermissions();

    const grouped: Record<string, any[]> = {};
    for (const permission of permissions) {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    }

    return grouped;
  }

  /**
   * Check if user can perform action on resource
   */
  async canPerformAction(
    userId: string,
    module: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const permissionCode = `${module}:${resource}:${action}`;
    return this.check(userId, permissionCode);
  }

  /**
   * Get user's accessible modules
   */
  async getUserModules(userId: string): Promise<string[]> {
    const userPermissions = await this.getUserPermissions(userId);

    if (userPermissions.isSuperAdmin) {
      // Get all modules
      const allPermissions = await this.database.permission.findMany({
        select: { module: true },
        distinct: ['module'],
      });
      return allPermissions.map((p) => p.module);
    }

    // Extract unique modules from user permissions
    const modules = new Set<string>();
    for (const permission of userPermissions.permissions) {
      const [module] = permission.split(':');
      modules.add(module);
    }

    return Array.from(modules);
  }

  /**
   * Compare two roles (for role hierarchy)
   */
  async compareRoles(roleId1: string, roleId2: string): Promise<number> {
    const [role1, role2] = await Promise.all([
      this.database.role.findUnique({ where: { id: roleId1 } }),
      this.database.role.findUnique({ where: { id: roleId2 } }),
    ]);

    if (!role1 || !role2) {
      throw new Error('Role not found');
    }

    return role1.level - role2.level;
  }

  /**
   * Check if role has higher level than another
   */
  async hasHigherRole(userId: string, targetUserId: string): Promise<boolean> {
    const [user, targetUser] = await Promise.all([
      this.database.user.findUnique({
        where: { id: userId },
        include: { role: true },
      }),
      this.database.user.findUnique({
        where: { id: targetUserId },
        include: { role: true },
      }),
    ]);

    if (!user || !targetUser) {
      throw new Error('User not found');
    }

    return user.role.level > targetUser.role.level;
  }

  /**
   * Invalidate cache for all users with specific role
   */
  private async invalidateRoleCache(roleId: string): Promise<void> {
    // Get all users with this role
    const users = await this.database.user.findMany({
      where: { roleId },
      select: { id: true },
    });

    // Invalidate cache for each user
    for (const user of users) {
      await this.invalidateUserCache(user.id);
    }
  }
}
