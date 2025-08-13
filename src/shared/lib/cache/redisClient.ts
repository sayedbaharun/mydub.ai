/**
 * Redis Cache Client for MyDub.AI
 * Provides caching layer for API responses and frequently accessed data
 */

// Type definitions for Redis (when package is not installed)
type RedisClientType = any;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Enable compression for large values
}

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    // Skip Redis initialization - we'll use in-memory cache for now
    return;
  }

  private async ensureConnection() {
    if (this.connectionPromise) {
      await this.connectionPromise;
    }
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      const value = await this.client!.get(this.prefixKey(key));
      
      if (!value) return null;
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      const serialized = JSON.stringify(value);
      const ttl = options.ttl || 3600; // Default 1 hour
      
      await this.client!.setEx(
        this.prefixKey(key),
        ttl,
        serialized
      );

      // Handle tags if provided
      if (options.tags && options.tags.length > 0) {
        await this.addToTags(key, options.tags);
      }

      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(this.prefixKey(key));
      return result > 0;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      await this.ensureConnection();
      const keys = await this.client!.keys(this.prefixKey(pattern));
      
      if (keys.length === 0) return 0;
      
      const result = await this.client!.del(keys);
      return result;
    } catch (error) {
      console.error('Redis delByPattern error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      await this.ensureConnection();
      
      const keysToDelete = new Set<string>();
      
      for (const tag of tags) {
        const keys = await this.client!.sMembers(this.tagKey(tag));
        keys.forEach(key => keysToDelete.add(key));
      }

      if (keysToDelete.size === 0) return 0;

      const result = await this.client!.del(Array.from(keysToDelete));
      
      // Clean up tag sets
      await Promise.all(tags.map(tag => this.client!.del(this.tagKey(tag))));
      
      return result;
    } catch (error) {
      console.error('Redis invalidateByTags error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client!.exists(this.prefixKey(key));
      return result > 0;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client!.ttl(this.prefixKey(key));
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      await this.ensureConnection();
      const fullKey = this.prefixKey(key);
      const result = await this.client!.incr(fullKey);
      
      if (ttl) {
        await this.client!.expire(fullKey, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  /**
   * Rate limiting helper
   */
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const count = await this.incr(key, window);
    const ttl = await this.ttl(key);
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: ttl > 0 ? ttl : window
    };
  }

  /**
   * Cache wrapper function
   */
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();
    
    // Store in cache
    await this.set(key, fresh, options);
    
    return fresh;
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client!.flushDb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Helper methods
  private prefixKey(key: string): string {
    const env = import.meta.env.VITE_ENV || 'development';
    return `mydubai:${env}:${key}`;
  }

  private tagKey(tag: string): string {
    return this.prefixKey(`tag:${tag}`);
  }

  private async addToTags(key: string, tags: string[]): Promise<void> {
    const fullKey = this.prefixKey(key);
    await Promise.all(
      tags.map(tag => this.client!.sAdd(this.tagKey(tag), fullKey))
    );
  }
}

// In-memory cache fallback for development
class InMemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private tags = new Map<string, Set<string>>();

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const ttl = options.ttl || 3600;
    const expires = Date.now() + (ttl * 1000);
    
    this.cache.set(key, { value, expires });
    
    if (options.tags) {
      options.tags.forEach(tag => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(key);
      });
    }
    
    return true;
  }

  async del(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0;
    
    tags.forEach(tag => {
      const keys = this.tags.get(tag);
      if (keys) {
        keys.forEach(key => {
          if (this.cache.delete(key)) count++;
        });
        this.tags.delete(tag);
      }
    });
    
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -2;
    
    const remaining = Math.floor((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }

  async incr(key: string, ttl?: number): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + 1;
    await this.set(key, newValue, { ttl });
    return newValue;
  }

  async checkRateLimit(identifier: string, limit: number, window: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const count = await this.incr(key, window);
    const ttl = await this.ttl(key);
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: ttl > 0 ? ttl : window
    };
  }

  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, options);
    return fresh;
  }

  async flush(): Promise<void> {
    this.cache.clear();
    this.tags.clear();
  }

  async disconnect(): Promise<void> {
    // No-op for in-memory cache
  }
}

// Export singleton instance
let cacheInstance: RedisCache | InMemoryCache;

export function getCacheClient(): RedisCache | InMemoryCache {
  if (!cacheInstance) {
    // Use Redis in production, in-memory in development
    if (import.meta.env.VITE_REDIS_URL) {
      cacheInstance = new RedisCache();
    } else {
      cacheInstance = new InMemoryCache();
    }
  }
  return cacheInstance;
}

// Cache key generators
export const CacheKeys = {
  // API responses
  api: (endpoint: string, params?: any) => 
    `api:${endpoint}:${params ? JSON.stringify(params) : 'default'}`,
  
  // User data
  user: (userId: string) => `user:${userId}`,
  userPreferences: (userId: string) => `user:${userId}:preferences`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
  
  // Content
  article: (id: string) => `article:${id}`,
  articles: (category?: string, page?: number) => 
    `articles:${category || 'all'}:${page || 1}`,
  
  // Government services
  governmentService: (id: string) => `gov:${id}`,
  governmentServices: (category?: string) => `gov:list:${category || 'all'}`,
  
  // Tourism
  tourismPlace: (id: string) => `tourism:${id}`,
  tourismPlaces: (category?: string) => `tourism:list:${category || 'all'}`,
  
  // Search
  searchResults: (query: string, filters?: any) => 
    `search:${query}:${filters ? JSON.stringify(filters) : 'default'}`,
  
  // AI Chat
  chatResponse: (prompt: string, model?: string) => 
    `chat:${model || 'default'}:${Buffer.from(prompt).toString('base64').slice(0, 32)}`,
  
  // Analytics
  analytics: (metric: string, period: string) => `analytics:${metric}:${period}`,
  
  // Rate limiting
  rateLimit: (identifier: string, action: string) => `rate:${identifier}:${action}`
};

// Cache tags for invalidation
export const CacheTags = {
  USER: 'user',
  CONTENT: 'content',
  ARTICLE: 'article',
  GOVERNMENT: 'government',
  TOURISM: 'tourism',
  SEARCH: 'search',
  CHAT: 'chat',
  ANALYTICS: 'analytics'
};