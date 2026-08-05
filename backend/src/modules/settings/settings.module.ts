/**
 * SETTINGS & SYSTEM ADMINISTRATION MODULE - PHASE 15
 * 
 * Complete Enterprise System Administration
 * 
 * FEATURES:
 * - Company Settings (Profile, Legal, Contact, Localization)
 * - Organization Management (Branches, Departments, Designations)
 * - System Configuration (UI, Theme, Session, Defaults)
 * - Authentication Settings (Password Policy, Login Security, OAuth)
 * - Email/SMS/WhatsApp Configuration
 * - File Storage Configuration
 * - Notification Channel Management
 * - Security Settings (CORS, Rate Limiting, JWT, Encryption)
 * - Role & Permission Management (Granular Access Control)
 * - Audit Logging (Comprehensive Audit Trail)
 * - System Monitoring (Logs, Metrics, Health Checks)
 * - Backup & Restore (Automated/Manual)
 * - Integration Management (Third-party Services)
 * - Feature Flags (Progressive Rollout)
 * 
 * ARCHITECTURE:
 * - Settings Engine: Cached, validated, type-safe configuration
 * - Permission Engine: Hierarchical, dynamic permission checking
 * - Audit Engine: Automatic, decorator-based logging
 * - Integration Engine: Provider-agnostic third-party integrations
 * 
 * ACCESS CONTROL:
 * - SUPER_ADMIN: Full system access
 * - ADMIN: Company & organization settings
 * - HR: Limited settings access
 * - MANAGER: View-only access
 * - EMPLOYEE: Personal preferences only
 * 
 * PRINCIPLES:
 * - Everything configurable from UI
 * - No hardcoded values
 * - Real-time configuration updates
 * - Settings versioning & rollback
 * - Multi-tenancy ready
 * - Audit trail for all changes
 * 
 * INTEGRATION READY FOR:
 * - AWS (S3, SES)
 * - Azure (Blob Storage, AD)
 * - Google (Cloud Storage, OAuth)
 * - Twilio (SMS, WhatsApp)
 * - SendGrid, Resend, MSG91
 * - MinIO, CloudFlare
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';

// Controllers
import { CompanySettingsController } from './controllers/company-settings.controller';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { OrganizationController } from './controllers/organization.controller';
import { AuthenticationSettingsController } from './controllers/authentication-settings.controller';
import { EmailSettingsController } from './controllers/email-settings.controller';
import { SMSSettingsController } from './controllers/sms-settings.controller';
import { WhatsAppSettingsController } from './controllers/whatsapp-settings.controller';
import { StorageSettingsController } from './controllers/storage-settings.controller';
import { NotificationSettingsController } from './controllers/notification-settings.controller';
import { SecuritySettingsController } from './controllers/security-settings.controller';
import { RolesPermissionsController } from './controllers/roles-permissions.controller';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { SystemLogsController } from './controllers/system-logs.controller';
import { BackupController } from './controllers/backup.controller';
import { IntegrationController } from './controllers/integration.controller';

// Services
import { SettingsService } from './services/settings.service';
import { CompanyService } from './services/company.service';
import { OrganizationService } from './services/organization.service';
import { RolePermissionService } from './services/role-permission.service';
import { AuditService } from './services/audit.service';
import { BackupService } from './services/backup.service';
import { IntegrationService } from './services/integration.service';
import { EmailService } from './services/email.service';
import { SMSService } from './services/sms.service';
import { WhatsAppService } from './services/whatsapp.service';
import { StorageService } from './services/storage.service';
import { NotificationChannelService } from './services/notification-channel.service';

// Engines
import { SettingsEngineService } from './engines/settings-engine.service';
import { PermissionEngineService } from './engines/permission-engine.service';
import { AuditEngineService } from './engines/audit-engine.service';
import { CacheEngineService } from './engines/cache-engine.service';

// Guards
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [
    CompanySettingsController,
    SystemSettingsController,
    OrganizationController,
    AuthenticationSettingsController,
    EmailSettingsController,
    SMSSettingsController,
    WhatsAppSettingsController,
    StorageSettingsController,
    NotificationSettingsController,
    SecuritySettingsController,
    RolesPermissionsController,
    AuditLogsController,
    SystemLogsController,
    BackupController,
    IntegrationController,
  ],
  providers: [
    // Core Services
    SettingsService,
    CompanyService,
    OrganizationService,
    RolePermissionService,
    AuditService,
    BackupService,
    IntegrationService,
    EmailService,
    SMSService,
    WhatsAppService,
    StorageService,
    NotificationChannelService,
    
    // Engines
    SettingsEngineService,
    PermissionEngineService,
    AuditEngineService,
    CacheEngineService,
    
    // Guards
    PermissionGuard,
  ],
  exports: [
    SettingsService,
    SettingsEngineService,
    PermissionEngineService,
    AuditEngineService,
    RolePermissionService,
    CompanyService,
    EmailService,
    SMSService,
    StorageService,
  ],
})
export class SettingsModule {}
