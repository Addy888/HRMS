/**
 * ATTENDANCE PROVIDER REGISTRY
 *
 * This is the PROVIDER FACTORY that manages all attendance providers.
 *
 * RESPONSIBILITIES:
 * 1. Register providers (manual, biometric, RFID, face recognition, etc.)
 * 2. Get active provider instance
 * 3. Switch between providers without code changes
 * 4. Maintain provider metadata
 *
 * EXTENSIBILITY:
 * New providers are added by:
 * 1. Implementing IAttendanceProvider interface
 * 2. Registering in the registry
 * 3. NO changes to business logic
 *
 * This implements the Strategy Pattern + Factory Pattern
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IAttendanceProvider,
  IProviderMetadata,
} from './base/attendance.provider.interface';
import { AttendanceSource } from '../enums';

@Injectable()
export class AttendanceProviderRegistry implements OnModuleInit {
  private readonly logger = new Logger(AttendanceProviderRegistry.name);

  // Registry of all available providers
  private providers: Map<string, IAttendanceProvider> = new Map();

  // Provider metadata for UI and configuration
  private metadata: Map<string, IProviderMetadata> = new Map();

  // Currently active provider (only one at a time)
  private activeProviderName: string | null = null;

  constructor(
    // Providers will be injected via dependency injection
    // As new providers are created, they'll be auto-injected
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Attendance Provider Registry');
    this.logger.log(
      `Registered providers: ${Array.from(this.providers.keys()).join(', ')}`,
    );
  }

  /**
   * REGISTER A PROVIDER
   * Called by providers on initialization
   */
  registerProvider(
    provider: IAttendanceProvider,
    metadata: IProviderMetadata,
  ): void {
    const name = provider.getName();
    this.providers.set(name, provider);
    this.metadata.set(name, metadata);
    this.logger.log(`Provider registered: ${name} (${metadata.displayName})`);
  }

  /**
   * GET ACTIVE PROVIDER
   * Returns the currently active provider instance
   * This is the PRIMARY method called by AttendanceService
   */
  async getActiveProvider(): Promise<IAttendanceProvider> {
    if (!this.activeProviderName) {
      // Default to MANUAL if no provider is set
      this.activeProviderName = 'MANUAL';
    }

    const provider = this.providers.get(this.activeProviderName);

    if (!provider) {
      throw new Error(
        `Active provider '${this.activeProviderName}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`,
      );
    }

    // Verify provider is active
    const isActive = await provider.isActive();
    if (!isActive) {
      throw new Error(
        `Provider '${this.activeProviderName}' is not active. Please check configuration.`,
      );
    }

    return provider;
  }

  /**
   * GET PROVIDER BY NAME
   * Retrieve specific provider (for testing, admin, etc.)
   */
  getProvider(name: string): IAttendanceProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * SET ACTIVE PROVIDER
   * Switch between providers at runtime
   */
  async setActiveProvider(name: string): Promise<void> {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(
        `Provider '${name}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`,
      );
    }

    // Verify provider can be activated
    const isActive = await provider.isActive();
    if (!isActive) {
      throw new Error(
        `Cannot activate provider '${name}'. Provider is not available or not configured.`,
      );
    }

    this.activeProviderName = name;
    this.logger.log(`Active provider switched to: ${name}`);
  }

  /**
   * GET ALL PROVIDERS
   * List all registered providers (for admin UI)
   */
  getAllProviders(): Array<{
    name: string;
    provider: IAttendanceProvider;
    metadata: IProviderMetadata;
    isActive: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      provider,
      metadata: this.metadata.get(name)!,
      isActive: name === this.activeProviderName,
    }));
  }

  /**
   * GET PROVIDER METADATA
   * Get information about a provider
   */
  getProviderMetadata(name: string): IProviderMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * GET ALL METADATA
   * List all provider metadata (for discovery)
   */
  getAllMetadata(): IProviderMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * CHECK IF PROVIDER EXISTS
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * GET PROVIDERS BY SOURCE TYPE
   * Filter providers by source (useful for UI filtering)
   */
  getProvidersBySource(source: AttendanceSource): IAttendanceProvider[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.getSource() === source,
    );
  }

  /**
   * HEALTH CHECK ALL PROVIDERS
   * Monitor health of all providers
   */
  async healthCheckAll(): Promise<
    Map<string, { healthy: boolean; message?: string }>
  > {
    const results = new Map();

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results.set(name, health);
      } catch (error) {
        results.set(name, {
          healthy: false,
          message: error.message,
        });
      }
    }

    return results;
  }
}
