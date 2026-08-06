/**
 * CACHE ENGINE SERVICE
 *
 * Abstraction layer for caching
 *
 * FEATURES:
 * - In-memory caching (default)
 * - Redis ready (for distributed systems)
 * - TTL support
 * - Pattern-based invalidation
 * - Cache statistics
 *
 * IMPLEMENTATION:
 * - Currently uses in-memory Map
 * - Can be extended to use Redis, Memcached, etc.
 * - Interface remains same for all implementations
 */

import { Injectable } from '@nestjs/common';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class CacheEngineService {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    dels: 0,
  };

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.stats.dels++;
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    this.stats.dels += deleted;
    return deleted;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    sets: number;
    dels: number;
    size: number;
    hitRate: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get all keys
   */
  async keys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());

    if (!pattern) {
      return keys;
    }

    const regex = new RegExp(pattern.replace('*', '.*'));
    return keys.filter((key) => regex.test(key));
  }
}
