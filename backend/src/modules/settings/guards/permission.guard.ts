/**
 * PERMISSION GUARD
 *
 * NestJS guard for route-level permission checking
 *
 * USAGE:
 * @UseGuards(PermissionGuard)
 * @RequirePermission('employees:user:create')
 * async createEmployee() { ... }
 *
 * @UseGuards(PermissionGuard)
 * @RequirePermissions(['employees:user:update', 'employees:user:read'], 'ALL')
 * async updateEmployee() { ... }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionEngineService } from '../engines/permission-engine.service';
import {
  PERMISSION_KEY,
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionEngine: PermissionEngineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get single permission
    const permission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get multiple permissions
    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get permissions mode (ALL or ANY)
    const mode =
      this.reflector.getAllAndOverride<'ALL' | 'ANY'>(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || 'ALL';

    // If no permissions specified, allow access
    if (!permission && (!permissions || permissions.length === 0)) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check single permission
    if (permission) {
      const hasPermission = await this.permissionEngine.check(
        user.id,
        permission,
      );

      if (!hasPermission) {
        throw new ForbiddenException(`Permission denied: ${permission}`);
      }

      return true;
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      const hasPermissions =
        mode === 'ALL'
          ? await this.permissionEngine.checkAll(user.id, permissions)
          : await this.permissionEngine.checkAny(user.id, permissions);

      if (!hasPermissions) {
        throw new ForbiddenException(
          `Permission denied: User needs ${mode === 'ALL' ? 'all' : 'at least one'} of [${permissions.join(', ')}]`,
        );
      }

      return true;
    }

    return true;
  }
}
