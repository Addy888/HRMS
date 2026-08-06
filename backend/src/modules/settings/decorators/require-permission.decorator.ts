/**
 * PERMISSION DECORATORS
 *
 * Custom decorators for permission-based access control
 *
 * USAGE:
 *
 * Single permission:
 * @RequirePermission('employees:user:create')
 * async createEmployee() { ... }
 *
 * Multiple permissions (requires ALL):
 * @RequirePermissions(['employees:user:update', 'employees:user:read'])
 * async updateEmployee() { ... }
 *
 * Multiple permissions (requires ANY):
 * @RequirePermissions(['employees:user:update', 'employees:user:delete'], 'ANY')
 * async modifyEmployee() { ... }
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

/**
 * Decorator to require a single permission
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

/**
 * Decorator to require multiple permissions
 * @param permissions - Array of permission codes
 * @param mode - 'ALL' (default) or 'ANY'
 */
export const RequirePermissions = (
  permissions: string[],
  mode: 'ALL' | 'ANY' = 'ALL',
) => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(PERMISSIONS_MODE_KEY, mode)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator to get current user from request
 */
export const CurrentUser = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    // This will be implemented by a custom decorator or interceptor
  };
};
