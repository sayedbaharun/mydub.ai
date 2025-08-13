/**
 * Supabase-based Cache Service
 * Uses Supabase for caching instead of Redis
 */

import { supabase } from '@/shared/lib/supabase';

interface CacheEntry {
  key: string;
  value: any;
  expires_at: string;
  created_at: string;
}

export class SupabaseCacheService {
  private static instance: SupabaseCacheService;
  private tableName = 'cache';

  private constructor() {
    this.ensureCacheTable();
  }

  static getInstance(): SupabaseCacheService {
    if (!SupabaseCacheService.instance) {
      SupabaseCacheService.instance = new SupabaseCacheService();
    }
    return SupabaseCacheService.instance;
  }

  /**
   * Ensure cache table exists (run this in a migration)
   */
  private async ensureCacheTable() {
    // This SQL should be in a Supabase migration:
    /*
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_cache_expires_at ON cache(expires_at);
    */
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(key);
        return null;
      }

      return data.value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();

      await supabase
        .from(this.tableName)
        .upsert({
          key,
          value,
          expires_at,
        });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await supabase
        .from(this.tableName)
        .delete()
        .eq('key', key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    try {
      await supabase
        .from(this.tableName)
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Cache clear expired error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await supabase
        .from(this.tableName)
        .delete()
        .neq('key', ''); // Delete all
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
    ttlSeconds: number = 300
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
export const supabaseCache = SupabaseCacheService.getInstance();