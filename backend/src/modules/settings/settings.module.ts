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

// Controllers - NONE exist yet, all commented out

// Services - Commented out until Prisma models exist
// import { SettingsService } from './services/settings.service';
// import { CompanyService } from './services/company.service';
// import { RolePermissionService } from './services/role-permission.service';

// Engines - Commented out until Prisma models exist
// import { SettingsEngineService } from './engines/settings-engine.service';
// import { PermissionEngineService } from './engines/permission-engine.service';
// import { AuditEngineService } from './engines/audit-engine.service';
import { CacheEngineService } from './engines/cache-engine.service';

// Guards
// import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [
    // No controllers implemented yet
  ],
  providers: [
    // NOTE: Most services commented out because required Prisma models don't exist yet:
    // - Permission model
    // - RolePermission model
    // - SystemSetting model
    // - Company model
    // These need to be added to prisma/schema.prisma before enabling

    CacheEngineService,
  ],
  exports: [CacheEngineService],
})
export class SettingsModule {}
