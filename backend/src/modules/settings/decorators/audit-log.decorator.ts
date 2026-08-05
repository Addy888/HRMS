/**
 * AUDIT LOG DECORATOR
 * 
 * Automatic audit logging for controller methods
 * 
 * USAGE:
 * @AuditLog('USER_CREATED', 'Created new user')
 * async createUser(@Body() dto: CreateUserDto) { ... }
 * 
 * @AuditLog('USER_UPDATED')
 * async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) { ... }
 */

import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';
export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_DETAILS_KEY = 'audit_details';

export interface AuditLogMetadata {
  action: string;
  details?: string;
}

/**
 * Decorator to enable automatic audit logging
 * @param action - Action name (e.g., 'USER_CREATED', 'SETTINGS_UPDATED')
 * @param details - Optional details template (can use {{param}} placeholders)
 */
export const AuditLog = (action: string, details?: string) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(AUDIT_LOG_KEY, true)(target, propertyKey, descriptor);
    SetMetadata(AUDIT_ACTION_KEY, action)(target, propertyKey, descriptor);
    if (details) {
      SetMetadata(AUDIT_DETAILS_KEY, details)(target, propertyKey, descriptor);
    }
  };
};

/**
 * Interceptor for audit logging (to be created)
 * This will intercept method calls and automatically log audit entries
 */
