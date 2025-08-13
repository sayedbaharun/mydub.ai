/**
 * Redis Cache Service
 * Provides caching functionality using Redis MCP server
 */

import { mcpConfig } from './index';

export class RedisCacheService {
  private static instance: RedisCacheService;
  private enabled: boolean;

  private constructor() {
    this.enabled = mcpConfig.redis.enabled;
  }

  static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // In a real implementation, this would use the Redis MCP server
      // For now, we'll use localStorage as a fallback
      const cached = localStorage.getItem(`cache:${key}`);
      if (!cached) return null;

      const { value, expiry } = JSON.parse(cached);
      if (expiry && new Date().getTime() > expiry) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }

      return value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const item = {
        value,
        expiry: ttlSeconds ? new Date().getTime() + ttlSeconds * 1000 : null,
      };
      localStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Cache wrapper for functions
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }
}

// Export singleton instance
export const redisCache = RedisCacheService.getInstance();