/**
 * COMPANY SERVICE
 * 
 * Manages company profile and settings
 * 
 * RESPONSIBILITIES:
 * - Company profile CRUD
 * - Company settings management
 * - Localization settings
 * - Legal information management
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { AuditEngineService } from '../engines/audit-engine.service';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto/company-settings.dto';

@Injectable()
export class CompanyService {
  constructor(
    private readonly database: DatabaseService,
    private readonly auditEngine: AuditEngineService,
  ) {}

  /**
   * Create company profile
   */
  async create(
    data: CreateCompanyDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const company = await this.database.company.create({
      data: {
        name: data.name,
        legalName: data.legalName,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        cinNumber: data.cinNumber,
        tanNumber: data.tanNumber,
        website: data.website,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        hrEmail: data.hrEmail,
        financeEmail: data.financeEmail,
        timeZone: data.timeZone || 'Asia/Kolkata',
        currency: data.currency || 'INR',
        currencySymbol: data.currencySymbol || '₹',
        language: data.language || 'en',
        dateFormat: data.dateFormat || 'DD/MM/YYYY',
        timeFormat: data.timeFormat || '12',
        workWeekStart: data.workWeekStart || 'MONDAY',
        fiscalYearStart: data.fiscalYearStart || 4,
      },
    });

    // Log creation
    await this.auditEngine.log({
      userId,
      action: 'COMPANY_CREATED',
      details: `Created company profile: ${company.name}`,
      metadata: { companyId: company.id },
      ipAddress,
      userAgent,
    });

    return company;
  }

  /**
   * Get company profile
   */
  async findOne() {
    // Assuming single company setup
    const company = await this.database.company.findFirst({
      where: { isActive: true },
      include: {
        branches: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    return company;
  }

  /**
   * Update company profile
   */
  async update(
    id: string,
    data: UpdateCompanyDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.database.company.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    const updated = await this.database.company.update({
      where: { id },
      data: {
        ...data,
      },
    });

    // Log changes
    await this.auditEngine.logChange(
      userId,
      'COMPANY_UPDATED',
      'Company',
      id,
      existing,
      updated,
      ipAddress,
      userAgent,
    );

    return updated;
  }

  /**
   * Get company settings for public API (localization)
   */
  async getPublicSettings() {
    const company = await this.findOne();

    return {
      name: company.name,
      logoUrl: company.logoUrl,
      faviconUrl: company.faviconUrl,
      timeZone: company.timeZone,
      currency: company.currency,
      currencySymbol: company.currencySymbol,
      language: company.language,
      dateFormat: company.dateFormat,
      timeFormat: company.timeFormat,
    };
  }

  /**
   * Update localization settings
   */
  async updateLocalization(
    id: string,
    data: {
      timeZone?: string;
      currency?: string;
      currencySymbol?: string;
      language?: string;
      dateFormat?: string;
      timeFormat?: string;
    },
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.database.company.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    const updated = await this.database.company.update({
      where: { id },
      data,
    });

    await this.auditEngine.log({
      userId,
      action: 'LOCALIZATION_UPDATED',
      details: 'Updated company localization settings',
      metadata: { companyId: id, changes: data },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Update legal information
   */
  async updateLegalInfo(
    id: string,
    data: {
      gstNumber?: string;
      panNumber?: string;
      cinNumber?: string;
      tanNumber?: string;
    },
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.database.company.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    const updated = await this.database.company.update({
      where: { id },
      data,
    });

    await this.auditEngine.log({
      userId,
      action: 'LEGAL_INFO_UPDATED',
      details: 'Updated company legal information',
      metadata: { companyId: id },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Upload company logo
   */
  async uploadLogo(
    id: string,
    logoUrl: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const company = await this.database.company.update({
      where: { id },
      data: { logoUrl },
    });

    await this.auditEngine.log({
      userId,
      action: 'LOGO_UPLOADED',
      details: 'Uploaded company logo',
      metadata: { companyId: id, logoUrl },
      ipAddress,
      userAgent,
    });

    return company;
  }

  /**
   * Upload company favicon
   */
  async uploadFavicon(
    id: string,
    faviconUrl: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const company = await this.database.company.update({
      where: { id },
      data: { faviconUrl },
    });

    await this.auditEngine.log({
      userId,
      action: 'FAVICON_UPLOADED',
      details: 'Uploaded company favicon',
      metadata: { companyId: id, faviconUrl },
      ipAddress,
      userAgent,
    });

    return company;
  }
}
