/**
 * ROLE & PERMISSION SERVICE
 * 
 * Manages roles and permissions
 * 
 * RESPONSIBILITIES:
 * - Role CRUD operations
 * - Permission CRUD operations
 * - Role-permission assignment
 * - Permission checking
 * - Role hierarchy management
 */

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { PermissionEngineService } from '../engines/permission-engine.service';
import { AuditEngineService } from '../engines/audit-engine.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
} from '../dto/role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly permissionEngine: PermissionEngineService,
    private readonly auditEngine: AuditEngineService,
  ) {}

  // ==================== ROLE MANAGEMENT ====================

  /**
   * Create new role
   */
  async createRole(
    data: CreateRoleDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check if role already exists
    const existing = await this.database.role.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Role ${data.name} already exists`);
    }

    const role = await this.database.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        level: data.level,
        isSystem: data.isSystem || false,
        isActive: data.isActive !== false,
      },
    });

    await this.auditEngine.log({
      userId,
      action: 'ROLE_CREATED',
      details: `Created role: ${role.name}`,
      metadata: { roleId: role.id, roleName: role.name },
      ipAddress,
      userAgent,
    });

    return role;
  }

  /**
   * Get all roles
   */
  async findAllRoles() {
    return this.database.role.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
            rolePermissions: true,
          },
        },
      },
      orderBy: { level: 'desc' },
    });
  }

  /**
   * Get role by ID
   */
  async findRoleById(id: string) {
    const role = await this.database.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Update role
   */
  async updateRole(
    id: string,
    data: UpdateRoleDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.database.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (existing.isSystem) {
      throw new BadRequestException('Cannot modify system role');
    }

    const updated = await this.database.role.update({
      where: { id },
      data,
    });

    await this.auditEngine.logChange(
      userId,
      'ROLE_UPDATED',
      'Role',
      id,
      existing,
      updated,
      ipAddress,
      userAgent,
    );

    // Invalidate permission cache for all users with this role
    await this.permissionEngine.invalidateAllCache();

    return updated;
  }

  /**
   * Delete role
   */
  async deleteRole(
    id: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const role = await this.database.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    if (role._count.users > 0) {
      throw new BadRequestException('Cannot delete role with assigned users');
    }

    await this.database.role.delete({
      where: { id },
    });

    await this.auditEngine.log({
      userId,
      action: 'ROLE_DELETED',
      details: `Deleted role: ${role.name}`,
      metadata: { roleId: id, roleName: role.name },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Role deleted successfully' };
  }

  // ==================== PERMISSION MANAGEMENT ====================

  /**
   * Create new permission
   */
  async createPermission(
    data: CreatePermissionDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const permission = await this.permissionEngine.createPermission({
      module: data.module,
      resource: data.resource,
      action: data.action,
      name: data.name,
      description: data.description,
      category: data.category,
    });

    await this.auditEngine.log({
      userId,
      action: 'PERMISSION_CREATED',
      details: `Created permission: ${permission.code}`,
      metadata: { permissionId: permission.id, code: permission.code },
      ipAddress,
      userAgent,
    });

    return permission;
  }

  /**
   * Get all permissions
   */
  async findAllPermissions() {
    return this.permissionEngine.getAllPermissions();
  }

  /**
   * Get permissions grouped by module
   */
  async findPermissionsByModule() {
    return this.permissionEngine.getPermissionsByModule();
  }

  /**
   * Get permission by ID
   */
  async findPermissionById(id: string) {
    const permission = await this.database.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  /**
   * Update permission
   */
  async updatePermission(
    id: string,
    data: UpdatePermissionDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.database.permission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    if (existing.isSystemPermission) {
      throw new BadRequestException('Cannot modify system permission');
    }

    const updated = await this.database.permission.update({
      where: { id },
      data,
    });

    await this.auditEngine.logChange(
      userId,
      'PERMISSION_UPDATED',
      'Permission',
      id,
      existing,
      updated,
      ipAddress,
      userAgent,
    );

    await this.permissionEngine.invalidateAllCache();

    return updated;
  }

  /**
   * Delete permission
   */
  async deletePermission(
    id: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const permission = await this.database.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission.isSystemPermission) {
      throw new BadRequestException('Cannot delete system permission');
    }

    if (permission._count.rolePermissions > 0) {
      throw new BadRequestException('Cannot delete permission assigned to roles');
    }

    await this.database.permission.delete({
      where: { id },
    });

    await this.auditEngine.log({
      userId,
      action: 'PERMISSION_DELETED',
      details: `Deleted permission: ${permission.code}`,
      metadata: { permissionId: id, code: permission.code },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Permission deleted successfully' };
  }

  // ==================== ROLE-PERMISSION ASSIGNMENT ====================

  /**
   * Assign permissions to role
   */
  async assignPermissions(
    data: AssignPermissionsDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const role = await this.database.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Sync permissions
    await this.permissionEngine.syncRolePermissions(
      data.roleId,
      data.permissionIds,
    );

    await this.auditEngine.log({
      userId,
      action: 'PERMISSIONS_ASSIGNED',
      details: `Assigned ${data.permissionIds.length} permissions to role ${role.name}`,
      metadata: {
        roleId: data.roleId,
        roleName: role.name,
        permissionCount: data.permissionIds.length,
      },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Permissions assigned successfully' };
  }

  /**
   * Grant specific permission to role
   */
  async grantPermission(
    roleId: string,
    permissionId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.permissionEngine.grantPermission(roleId, permissionId);

    await this.auditEngine.logPermissionChange(
      userId,
      'PERMISSION_GRANTED',
      roleId,
      permissionId,
      true,
      ipAddress,
      userAgent,
    );

    return { success: true, message: 'Permission granted successfully' };
  }

  /**
   * Revoke specific permission from role
   */
  async revokePermission(
    roleId: string,
    permissionId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.permissionEngine.revokePermission(roleId, permissionId);

    await this.auditEngine.logPermissionChange(
      userId,
      'PERMISSION_REVOKED',
      roleId,
      permissionId,
      false,
      ipAddress,
      userAgent,
    );

    return { success: true, message: 'Permission revoked successfully' };
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string) {
    const role = await this.database.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.permissionEngine.getRolePermissions(roleId);
  }

  // ==================== PERMISSION CHECKING ====================

  /**
   * Check if user has permission
   */
  async checkUserPermission(userId: string, permissionCode: string) {
    const hasPermission = await this.permissionEngine.check(userId, permissionCode);
    
    return {
      userId,
      permissionCode,
      hasPermission,
    };
  }

  /**
   * Check multiple permissions
   */
  async checkUserPermissions(
    userId: string,
    permissionCodes: string[],
    mode: 'ALL' | 'ANY' = 'ALL',
  ) {
    const hasPermission = mode === 'ALL'
      ? await this.permissionEngine.checkAll(userId, permissionCodes)
      : await this.permissionEngine.checkAny(userId, permissionCodes);
    
    return {
      userId,
      permissionCodes,
      mode,
      hasPermission,
    };
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string) {
    return this.permissionEngine.getUserPermissions(userId);
  }

  /**
   * Get user accessible modules
   */
  async getUserModules(userId: string) {
    const modules = await this.permissionEngine.getUserModules(userId);
    
    return {
      userId,
      modules,
    };
  }
}
