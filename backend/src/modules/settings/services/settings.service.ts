/**
 * SETTINGS SERVICE
 *
 * Main service for system settings management
 * Provides high-level API for configuration operations
 *
 * RESPONSIBILITIES:
 * - Settings CRUD operations
 * - Category-based settings management
 * - Settings validation
 * - Settings import/export
 * - Settings versioning
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SettingsEngineService } from '../engines/settings-engine.service';
import { AuditEngineService } from '../engines/audit-engine.service';
import {
  SystemSettingDto,
  UpdateSystemSettingDto,
  BulkUpdateSystemSettingsDto,
} from '../dto/system-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly database: PrismaService,
    private readonly settingsEngine: SettingsEngineService,
    private readonly auditEngine: AuditEngineService,
  ) {}

  /**
   * Get all settings
   */
  async findAll(includeEncrypted: boolean = false) {
    return this.settingsEngine.getAll(includeEncrypted);
  }

  /**
   * Get settings by category
   */
  async findByCategory(category: string) {
    return this.settingsEngine.getByCategory(category);
  }

  /**
   * Get specific setting
   */
  async findOne(category: string, key: string) {
    const exists = await this.settingsEngine.exists(category, key);
    if (!exists) {
      throw new NotFoundException(`Setting ${category}.${key} not found`);
    }

    const value = await this.settingsEngine.get(category, key);

    return {
      category,
      key,
      value,
    };
  }

  /**
   * Create or update setting
   */
  async upsert(
    data: SystemSettingDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate data type
    this.validateDataType(data.value, data.dataType);

    // Get old value for audit
    const oldValue = await this.settingsEngine.get(data.category, data.key);

    // Set new value
    await this.settingsEngine.set(
      data.category,
      data.key,
      data.value,
      userId,
      data.description,
    );

    // Log change
    await this.auditEngine.logSettingsChange(
      userId,
      data.category,
      data.key,
      oldValue,
      data.value,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: `Setting ${data.category}.${data.key} updated successfully`,
    };
  }

  /**
   * Update setting value
   */
  async update(
    category: string,
    key: string,
    data: UpdateSystemSettingDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const exists = await this.settingsEngine.exists(category, key);
    if (!exists) {
      throw new NotFoundException(`Setting ${category}.${key} not found`);
    }

    // Get old value for audit
    const oldValue = await this.settingsEngine.get(category, key);

    // Set new value
    await this.settingsEngine.set(
      category,
      key,
      data.value,
      userId,
      data.description,
    );

    // Log change
    await this.auditEngine.logSettingsChange(
      userId,
      category,
      key,
      oldValue,
      data.value,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: `Setting ${category}.${key} updated successfully`,
    };
  }

  /**
   * Bulk update settings
   */
  async bulkUpdate(
    data: BulkUpdateSystemSettingsDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const results: Array<{
      category: string;
      key: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const setting of data.settings) {
      try {
        const oldValue = await this.settingsEngine.get(
          setting.category,
          setting.key,
        );

        await this.settingsEngine.set(
          setting.category,
          setting.key,
          setting.value,
          userId,
        );

        await this.auditEngine.logSettingsChange(
          userId,
          setting.category,
          setting.key,
          oldValue,
          setting.value,
          ipAddress,
          userAgent,
        );

        results.push({
          category: setting.category,
          key: setting.key,
          success: true,
        });
      } catch (error) {
        results.push({
          category: setting.category,
          key: setting.key,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      results,
    };
  }

  /**
   * Delete setting
   */
  async delete(
    category: string,
    key: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const exists = await this.settingsEngine.exists(category, key);
    if (!exists) {
      throw new NotFoundException(`Setting ${category}.${key} not found`);
    }

    // Get old value for audit
    const oldValue = await this.settingsEngine.get(category, key);

    await this.settingsEngine.delete(category, key);

    // Log deletion
    await this.auditEngine.logSettingsChange(
      userId,
      category,
      key,
      oldValue,
      null,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: `Setting ${category}.${key} deleted successfully`,
    };
  }

  /**
   * Get public settings (no authentication required)
   */
  async getPublicSettings() {
    return this.settingsEngine.getPublicSettings();
  }

  /**
   * Export settings (for backup/migration)
   */
  async export(categories?: string[]) {
    const allSettings = await this.settingsEngine.getAll(false);

    if (categories && categories.length > 0) {
      return allSettings.filter((s) => categories.includes(s.category));
    }

    return allSettings;
  }

  /**
   * Import settings (from backup/migration)
   */
  async import(
    settings: SystemSettingDto[],
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const results: Array<{
      category: string;
      key: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const setting of settings) {
      try {
        await this.upsert(setting, userId, ipAddress, userAgent);
        results.push({
          category: setting.category,
          key: setting.key,
          success: true,
        });
      } catch (error) {
        results.push({
          category: setting.category,
          key: setting.key,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      imported: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Get settings by pattern (admin only)
   */
  async search(pattern: string) {
    const allSettings = await this.settingsEngine.getAll(false);
    const regex = new RegExp(pattern, 'i');

    return allSettings.filter(
      (s) =>
        regex.test(s.category) ||
        regex.test(s.key) ||
        regex.test(s.description || ''),
    );
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults() {
    const defaults = this.getDefaultSettings();

    for (const setting of defaults) {
      const exists = await this.settingsEngine.exists(
        setting.category,
        setting.key,
      );
      if (!exists) {
        await this.settingsEngine.set(
          setting.category,
          setting.key,
          setting.value,
          'SYSTEM',
          setting.description,
        );
      }
    }

    return {
      success: true,
      message: 'Default settings initialized',
    };
  }

  /**
   * Validate data type
   */
  private validateDataType(value: any, dataType: string): void {
    switch (dataType) {
      case 'NUMBER':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          throw new BadRequestException('Value must be a number');
        }
        break;
      case 'BOOLEAN':
        if (
          typeof value !== 'boolean' &&
          value !== 'true' &&
          value !== 'false'
        ) {
          throw new BadRequestException('Value must be a boolean');
        }
        break;
      case 'JSON':
      case 'ARRAY':
        if (typeof value !== 'object') {
          throw new BadRequestException(
            `Value must be ${dataType.toLowerCase()}`,
          );
        }
        break;
    }
  }

  /**
   * Get default system settings
   */
  private getDefaultSettings(): SystemSettingDto[] {
    return [
      // System Settings
      {
        category: 'SYSTEM',
        key: 'THEME_MODE',
        value: 'LIGHT',
        dataType: 'STRING',
        description: 'Default theme mode (LIGHT, DARK, AUTO)',
        isPublic: true,
      },
      {
        category: 'SYSTEM',
        key: 'SIDEBAR_LAYOUT',
        value: 'VERTICAL',
        dataType: 'STRING',
        description: 'Default sidebar layout',
        isPublic: true,
      },
      {
        category: 'SYSTEM',
        key: 'PAGINATION_SIZE',
        value: 10,
        dataType: 'NUMBER',
        description: 'Default pagination size',
        isPublic: true,
      },
      {
        category: 'SYSTEM',
        key: 'DEFAULT_LANGUAGE',
        value: 'en',
        dataType: 'STRING',
        description: 'Default system language',
        isPublic: true,
      },
      {
        category: 'SYSTEM',
        key: 'SESSION_TIMEOUT',
        value: 30,
        dataType: 'NUMBER',
        description: 'Session timeout in minutes',
        isPublic: false,
      },
      {
        category: 'SYSTEM',
        key: 'AUTO_LOGOUT',
        value: true,
        dataType: 'BOOLEAN',
        description: 'Enable automatic logout on timeout',
        isPublic: false,
      },

      // Authentication Settings
      {
        category: 'AUTHENTICATION',
        key: 'PASSWORD_MIN_LENGTH',
        value: 8,
        dataType: 'NUMBER',
        description: 'Minimum password length',
        isPublic: true,
      },
      {
        category: 'AUTHENTICATION',
        key: 'PASSWORD_REQUIRE_UPPERCASE',
        value: true,
        dataType: 'BOOLEAN',
        description: 'Require uppercase letters in password',
        isPublic: true,
      },
      {
        category: 'AUTHENTICATION',
        key: 'PASSWORD_REQUIRE_LOWERCASE',
        value: true,
        dataType: 'BOOLEAN',
        description: 'Require lowercase letters in password',
        isPublic: true,
      },
      {
        category: 'AUTHENTICATION',
        key: 'PASSWORD_REQUIRE_NUMBERS',
        value: true,
        dataType: 'BOOLEAN',
        description: 'Require numbers in password',
        isPublic: true,
      },
      {
        category: 'AUTHENTICATION',
        key: 'PASSWORD_REQUIRE_SPECIAL_CHARS',
        value: false,
        dataType: 'BOOLEAN',
        description: 'Require special characters in password',
        isPublic: true,
      },
      {
        category: 'AUTHENTICATION',
        key: 'MAX_LOGIN_ATTEMPTS',
        value: 5,
        dataType: 'NUMBER',
        description: 'Maximum login attempts before lockout',
        isPublic: false,
      },
      {
        category: 'AUTHENTICATION',
        key: 'LOCKOUT_DURATION',
        value: 30,
        dataType: 'NUMBER',
        description: 'Account lockout duration in minutes',
        isPublic: false,
      },

      // Security Settings
      {
        category: 'SECURITY',
        key: 'JWT_ACCESS_TOKEN_EXPIRY',
        value: 15,
        dataType: 'NUMBER',
        description: 'JWT access token expiry in minutes',
        isPublic: false,
      },
      {
        category: 'SECURITY',
        key: 'JWT_REFRESH_TOKEN_EXPIRY',
        value: 7,
        dataType: 'NUMBER',
        description: 'JWT refresh token expiry in days',
        isPublic: false,
      },
      {
        category: 'SECURITY',
        key: 'API_RATE_LIMIT_PER_MINUTE',
        value: 60,
        dataType: 'NUMBER',
        description: 'API rate limit per minute',
        isPublic: false,
      },
      {
        category: 'SECURITY',
        key: 'CORS_ENABLED',
        value: true,
        dataType: 'BOOLEAN',
        description: 'Enable CORS',
        isPublic: false,
      },
    ];
  }
}
