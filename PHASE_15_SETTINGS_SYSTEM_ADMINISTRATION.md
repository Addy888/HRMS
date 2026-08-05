# PHASE 15: SETTINGS & SYSTEM ADMINISTRATION

## 🎯 Overview
Complete Enterprise System Administration Module that controls the entire HRMS application. Everything is configurable from the UI without changing source code.

## 📋 Features

### 1. **Company Settings**
- Company profile (Name, Logo, Address)
- Legal information (GST, PAN, CIN)
- Contact details (Website, Email, Phone)
- Localization (Time Zone, Currency, Language)
- Format preferences (Date, Time)

### 2. **Organization Settings**
- Branch management
- Department structure
- Designation hierarchy
- Job titles
- Employment types
- Reporting hierarchy configuration

### 3. **System Settings**
- UI preferences (Theme, Dark/Light Mode, Sidebar Layout)
- Dashboard widgets configuration
- Pagination settings
- Default language
- Session management (Timeout, Auto Logout)

### 4. **Authentication Settings**
- Password policy configuration
  - Minimum length
  - Complexity requirements
  - Password expiry
  - History tracking
- Login security
  - Maximum login attempts
  - Account lockout duration
- Future ready:
  - Two-Factor Authentication (2FA)
  - OTP integration
  - Google OAuth
  - Microsoft OAuth

### 5. **Email Settings**
- Multiple provider support:
  - SMTP
  - Resend
  - AWS SES
  - SendGrid
- Email templates management
- Email queue configuration

### 6. **SMS Settings**
- Provider integration:
  - Twilio
  - MSG91
  - TextLocal
- Template management
- Future provider support

### 7. **WhatsApp Settings**
- Meta Cloud API integration
- Twilio WhatsApp
- Template management
- Future provider support

### 8. **File Storage Settings**
- Storage provider configuration:
  - Local Storage
  - AWS S3
  - MinIO
  - Azure Blob Storage
  - Google Cloud Storage
- Storage limits and quotas
- File type restrictions

### 9. **Notification Settings**
- Channel configuration:
  - Email notifications
  - SMS notifications
  - WhatsApp notifications
  - Push notifications
  - Browser notifications
- Notification preferences per module
- Delivery retry logic

### 10. **Holiday Settings**
- National holidays
- Company holidays
- State-specific holidays
- Optional holidays
- Holiday calendar management

### 11. **Work Settings**
- Working days configuration
- Working hours
- Week-off policy
- Shift rules
- Late arrival rules
- Overtime policies

### 12. **Security Settings**
- CORS configuration
- Rate limiting
- Helmet security headers
- JWT token settings
  - Access token expiry
  - Refresh token expiry
- API key management
- Encryption key rotation

### 13. **Role & Permission Management**
- Role creation and management
- Permission assignment
- Granular access control:
  - Menu permissions
  - Module permissions
  - API endpoint permissions
  - Button-level permissions
  - Field-level permissions

### 14. **Audit Logging**
- Comprehensive audit trail:
  - User authentication events
  - Profile updates
  - Settings changes
  - Permission modifications
  - Password changes
  - All CRUD operations
- Audit log retention policies
- Audit log exports

### 15. **System Logs**
- Application logs
- Error logs with stack traces
- Security logs
- Database query logs
- API request/response logs
- Performance metrics

### 16. **Backup & Restore**
- Database backup
- File backup
- Automated backup scheduling
- Manual backup triggers
- Point-in-time restore
- Backup verification

## 🗂️ Database Schema

### Core Models
- `SystemSetting` - Key-value system configuration
- `Company` - Company profile and settings
- `Branch` - Branch/location management
- `Permission` - Permission definitions
- `Role` - User roles
- `RolePermission` - Role-permission mapping
- `AuditLog` - Audit trail
- `ApplicationLog` - System logs
- `BackupHistory` - Backup records
- `EmailTemplate` - Email template management
- `SMSTemplate` - SMS template management
- `NotificationPreference` - User notification preferences
- `SecuritySetting` - Security configuration
- `IntegrationConfig` - Third-party integration configs

## 🏗️ Architecture

### Backend Structure
```
src/modules/settings/
├── controllers/
│   ├── company-settings.controller.ts
│   ├── system-settings.controller.ts
│   ├── organization.controller.ts
│   ├── authentication-settings.controller.ts
│   ├── email-settings.controller.ts
│   ├── sms-settings.controller.ts
│   ├── storage-settings.controller.ts
│   ├── notification-settings.controller.ts
│   ├── security-settings.controller.ts
│   ├── roles-permissions.controller.ts
│   ├── audit-logs.controller.ts
│   ├── system-logs.controller.ts
│   └── backup.controller.ts
├── services/
│   ├── settings.service.ts
│   ├── company.service.ts
│   ├── organization.service.ts
│   ├── role-permission.service.ts
│   ├── audit.service.ts
│   ├── backup.service.ts
│   └── integration.service.ts
├── engines/
│   ├── settings-engine.service.ts
│   ├── permission-engine.service.ts
│   └── audit-engine.service.ts
├── dto/
│   ├── company-settings.dto.ts
│   ├── system-settings.dto.ts
│   ├── role.dto.ts
│   └── permission.dto.ts
├── guards/
│   ├── permission.guard.ts
│   └── settings-access.guard.ts
├── decorators/
│   ├── require-permission.decorator.ts
│   └── audit-log.decorator.ts
└── settings.module.ts
```

## 🔐 Access Control

### Super Admin
- Full system access
- Manage all settings
- Configure security
- Manage backups
- View all audit logs

### Admin
- Manage company settings
- Configure organization structure
- Manage roles and permissions
- View audit logs

### HR
- View company settings
- Configure work policies
- View relevant audit logs

### Manager
- View organization structure
- View work policies

### Employee
- View company information
- View public holidays
- Update personal notification preferences

## 🎨 UI/UX Design Inspiration

### Design System
- **Stripe**: Clean, modern, minimalistic
- **Linear**: Beautiful animations and micro-interactions
- **Workday**: Professional enterprise feel
- **Notion**: Intuitive navigation and organization

### Features
- Dark mode / Light mode toggle
- Responsive design
- Real-time updates
- Contextual help
- Keyboard shortcuts
- Search functionality
- Breadcrumb navigation

## 📊 Key Features

### Dynamic Configuration
- All settings stored in database
- Real-time configuration updates
- No application restart required
- Settings versioning
- Rollback capability

### Multi-Tenancy Ready
- Branch-specific settings
- Department-specific configurations
- Role-based settings override

### Audit & Compliance
- Complete audit trail
- Compliance reporting
- Data retention policies
- GDPR-ready

### Integration Ready
- RESTful API for all settings
- Webhook support
- Event-driven architecture
- Third-party integrations

## 🔄 Implementation Phases

### Phase 15.1: Core Settings (Current)
✅ Database schema
✅ Basic CRUD operations
✅ System settings engine
⏳ Company settings
⏳ Organization settings

### Phase 15.2: Security & Authentication
⏳ Password policies
⏳ Security settings
⏳ JWT configuration
⏳ Rate limiting

### Phase 15.3: Integrations
⏳ Email providers
⏳ SMS providers
⏳ Storage providers
⏳ WhatsApp integration

### Phase 15.4: Roles & Permissions
⏳ Role management
⏳ Permission engine
⏳ Access control
⏳ Button-level permissions

### Phase 15.5: Audit & Monitoring
⏳ Audit logging
⏳ System logs
⏳ Performance monitoring
⏳ Alert system

### Phase 15.6: Backup & Restore
⏳ Backup automation
⏳ Restore functionality
⏳ Backup verification
⏳ Cloud backup

## 🚀 Technical Implementation

### Settings Engine
- Cached settings for performance
- Real-time updates via WebSocket
- Settings validation
- Type-safe configuration

### Permission Engine
- Hierarchical permissions
- Role inheritance
- Dynamic permission checking
- API-level authorization

### Audit Engine
- Automatic audit trail
- Decorator-based logging
- Async audit processing
- Audit log aggregation

## 📚 Documentation

- Settings API documentation
- Administrator guide
- Security best practices
- Backup & restore guide
- Integration guides

---

**Status**: Schema Design Complete, Implementation Starting
**Next**: Create database models and core services
